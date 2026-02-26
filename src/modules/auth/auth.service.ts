import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import type { Response } from 'express';
import { HttpClientService } from '../http-client/http-client.service';
import { LoginService } from '../vlute/login/login.service';
import { StudentService } from '../vlute/user/student/student.service';
import { UserService } from '../user/user.service';
import { KeyTokenService } from '../key-token/key-token.service';
import { ForbiddenError, UnauthorizedError } from '@/core/response';
import { EncryptionService } from '../encryption/encryption.service';
import { JwtTokenService } from '../jwt-token/jwt-token.service';
import appConfig from '@/configs/app.config';
import vluteConfig from '../vlute/vlute.config';

@Injectable()
export class AuthService {
  constructor(
    private readonly httpClientService: HttpClientService,
    private readonly vluteLoginService: LoginService,
    private readonly studentService: StudentService,
    private readonly userService: UserService,
    private readonly keyTokenService: KeyTokenService,
    private readonly encryptionService: EncryptionService,
    private readonly jwtTokenService: JwtTokenService,
    @Inject(appConfig.KEY)
    private readonly config: ConfigType<typeof appConfig>,
    @Inject(vluteConfig.KEY)
    private readonly authConf: ConfigType<typeof vluteConfig>,
  ) {}

  private get COOKIE_OPTIONS() {
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
    };
  }

  setAuthCookies(
    res: Response,
    tokens: { accessToken: string; refreshToken: string },
  ) {
    res.cookie('accessToken', tokens.accessToken, {
      ...this.COOKIE_OPTIONS,
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('refreshToken', tokens.refreshToken, {
      ...this.COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }

  clearAuthCookies(res: Response) {
    res.clearCookie('accessToken', this.COOKIE_OPTIONS);
    res.clearCookie('refreshToken', this.COOKIE_OPTIONS);
  }

  async login(studentId: string, password: string, res: Response) {
    try {
      // 1. Initialize SSO Session for Daotao (where the profile API is)
      const { ssoUrl, cookies: initialCookies } =
        await this.vluteLoginService.initializeSsoSession(
          this.authConf.sso.redirectUri.daotao,
        );

      // 2. Authenticate with SSO
      const email = `${studentId}@${this.config.studentEmailSuffix}`;
      const authResponse = await this.vluteLoginService.authenticate(
        email,
        password,
        ssoUrl,
        initialCookies,
      );

      const redirectLocation = authResponse.headers.location as
        | string
        | undefined;
      if (!redirectLocation) {
        throw new UnauthorizedError('Invalid credentials or SSO error');
      }

      // 3. Consume Callback to get VLUTE cookies
      const callbackResult =
        await this.vluteLoginService.consumeCallback(redirectLocation);
      if (!callbackResult.success) {
        throw new UnauthorizedError(callbackResult.message);
      }

      // 4. Get Student Profile from VLUTE
      const profile = await this.studentService.getProfile(
        callbackResult.cookies,
      );

      // 5. Sync User in our system
      const user = await this.userService.syncUser(profile);

      // 6. Create KeyToken and JWT Pair
      const vluteToken = JSON.stringify(callbackResult.cookies);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const tokens = await this.keyTokenService.createKeyToken({
        userId: (user as any)._id.toString(),
        studentId: user.student_id,
        vluteToken,
        expiresAt,
      });

      // 7. Set Cookies
      this.setAuthCookies(res, tokens);

      return this.userService.getUserLoginInfo(user);
    } catch (error) {
      if (error instanceof UnauthorizedError) throw error;
      return this.handleGeneralError(error);
    }
  }

  async logout(userId: string, res: Response) {
    await this.keyTokenService.removeByUserId(userId);
    this.clearAuthCookies(res);
  }

  async refreshToken(refreshToken: string, res: Response) {
    // 1. Decode refresh token (no verify) to get userId
    let userId: string;
    let studentId: string;
    let sessionSecret: string;
    try {
      // Decode for metadata without verification
      const payload = this.jwtTokenService.decodeToken(refreshToken);
      if (!payload) throw new Error();
      userId = payload.userId;
      studentId = payload.studentId;
      sessionSecret = payload.sessionSecret;
    } catch {
      throw new UnauthorizedError('Invalid refresh token format');
    }

    // 2. Find KeyToken
    const keyToken = await this.keyTokenService.findByUserId(userId);
    if (!keyToken || !keyToken.publicKeyHistory?.length) {
      throw new UnauthorizedError('Session not found, please login again');
    }

    // 3. Verify with RSA rotation logic
    const latestPubKey = keyToken.publicKeyHistory[0];
    try {
      this.jwtTokenService.verifyToken(refreshToken, latestPubKey);
    } catch {
      // Check for intrusion (reuse of old token)
      for (let i = 1; i < keyToken.publicKeyHistory.length; i++) {
        try {
          this.jwtTokenService.verifyToken(
            refreshToken,
            keyToken.publicKeyHistory[i],
          );
          // Match found in history -> INTRUSION!
          await this.keyTokenService.handleIntrusion(userId);
          throw new ForbiddenError(
            'Security alert: Refresh token reuse detected. All sessions cleared.',
          );
        } catch (inner) {
          if (inner instanceof ForbiddenError) throw inner;
          continue;
        }
      }
      throw new UnauthorizedError('Refresh token invalid or expired');
    }

    // 4. Decrypt existing VLUTE token
    let vluteToken: string;
    try {
      vluteToken = this.encryptionService.decryptToken(
        keyToken.encryptedToken,
        keyToken.iv,
        keyToken.authTag,
        sessionSecret,
        keyToken.nonce,
      );
    } catch {
      // If decryption fails, it means the sessionSecret in the token doesn't match the DB
      await this.keyTokenService.handleIntrusion(userId);
      throw new UnauthorizedError(
        'Invalid session secret. Potential session tampering detected.',
      );
    }

    // 5. Rotate Keys and Tokens
    // We set a new expiry (e.g., 7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const tokens = await this.keyTokenService.createKeyToken({
      userId,
      studentId,
      vluteToken,
      expiresAt,
    });

    // 6. Set Cookies
    this.setAuthCookies(res, tokens);

    return {
      tokens,
      user: await this.getMe(userId),
    };
  }

  async getMe(userId: string) {
    const user = await this.userService.findOne(userId);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }
    return this.userService.getUserLoginInfo(user);
  }

  /**
   * Centralized error handler for the login flow.
   */
  handleGeneralError(error: unknown): never {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[AuthService] Critical Error: ${message}`);

    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as {
        response: {
          status: number;
          headers: Record<string, string | string[] | undefined>;
        };
      };
      console.error('[AuthService] Error Status:', axiosError.response.status);
    }
    throw error;
  }
}
