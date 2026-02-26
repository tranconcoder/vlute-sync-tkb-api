import {
  Controller,
  Post,
  Get,
  Body,
  Res,
  Req,
  Inject,
  UseGuards,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginService } from '../vlute/login/login.service';
import { LoginDto } from './dto/login.dto';
import { StudentService } from '../vlute/user/student/student.service';
import { UserService } from '../user/user.service';
import { KeyTokenService } from '../key-token/key-token.service';
import { AuthGuard } from '@/common/guards/auth.guard';
import { OkResponse } from '@/core/response';
import { UnauthorizedError } from '@/core/response';
import appConfig from '@/configs/app.config';
import vluteConfig from '../vlute/vlute.config';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly vluteLoginService: LoginService,
    private readonly studentService: StudentService,
    private readonly userService: UserService,
    private readonly keyTokenService: KeyTokenService,
    @Inject(appConfig.KEY)
    private readonly config: ConfigType<typeof appConfig>,
    @Inject(vluteConfig.KEY)
    private readonly authConf: ConfigType<typeof vluteConfig>,
  ) {}

  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { student_id, password } = loginDto;

    try {
      // 1. Initialize SSO Session for Daotao (where the profile API is)
      const { ssoUrl, cookies: initialCookies } =
        await this.vluteLoginService.initializeSsoSession(
          this.authConf.sso.redirectUri.daotao,
        );

      // 2. Authenticate with SSO
      const email = `${student_id}${this.config.studentEmailSuffix}`;
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

      // 7. Set HTTP-only cookies
      res.cookie('accessToken', tokens.accessToken, {
        ...COOKIE_OPTIONS,
        maxAge: 15 * 60 * 1000, // 15 minutes
      });

      res.cookie('refreshToken', tokens.refreshToken, {
        ...COOKIE_OPTIONS,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // 8. Return standardized success response
      return new OkResponse({
        message: 'Đăng nhập thành công',
        data: this.userService.getUserLoginInfo(user),
      });
    } catch (error) {
      if (error instanceof UnauthorizedError) throw error;
      return this.authService.handleGeneralError(error);
    }
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const payload = req['user'] as { userId: string };
    await this.keyTokenService.removeByUserId(payload.userId);

    res.clearCookie('accessToken', COOKIE_OPTIONS);
    res.clearCookie('refreshToken', COOKIE_OPTIONS);

    return new OkResponse({ message: 'Đăng xuất thành công' });
  }

  @Get('me')
  @UseGuards(AuthGuard)
  async me(@Req() req: Request) {
    const payload = req['user'] as { userId: string };
    const user = await this.userService.findOne(payload.userId);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }
    return new OkResponse({
      message: 'User info',
      data: this.userService.getUserLoginInfo(user),
    });
  }
}
