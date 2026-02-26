import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { AuthService } from './auth.service';
import { VluteLoginService } from './vlute-login.service';
import { LoginDto } from './dto/login.dto';
import { StudentService } from '../student/student.service';
import { UserService } from '../user/user.service';
import { KeyTokenService } from '../key-token/key-token.service';
import appConfig from '@/configs/app.config';
import authConfig from './auth.config';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly vluteLoginService: VluteLoginService,
    private readonly studentService: StudentService,
    private readonly userService: UserService,
    private readonly keyTokenService: KeyTokenService,
    @Inject(appConfig.KEY)
    private readonly config: ConfigType<typeof appConfig>,
    @Inject(authConfig.KEY)
    private readonly authConf: ConfigType<typeof authConfig>,
  ) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
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
        throw new UnauthorizedException('Invalid credentials or SSO error');
      }

      // 3. Consume Callback to get VLUTE cookies
      const callbackResult =
        await this.vluteLoginService.consumeCallback(redirectLocation);
      if (!callbackResult.success) {
        throw new UnauthorizedException(callbackResult.message);
      }

      // 4. Get Student Profile from VLUTE
      const profile = await this.studentService.getProfile(
        callbackResult.cookies,
      );

      // 5. Sync User in our system
      const user = await this.userService.syncUser(profile);
      console.log({
        user,
      });

      // 6. Create KeyToken and JWT Pair
      // We'll use the VLUTE session cookies as the "vluteToken" to be encrypted
      const vluteToken = JSON.stringify(callbackResult.cookies);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Default 7 days

      return await this.keyTokenService.createKeyToken({
        userId: (user as any)._id.toString(),
        studentId: user.student_id,
        vluteToken,
        expiresAt,
      });
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      return this.authService.handleGeneralError(error);
    }
  }
}
