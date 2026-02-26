import { Controller, Get, Req, UseGuards, Res, Inject } from '@nestjs/common';
import { AuthGuard as PassportAuthGuard } from '@nestjs/passport';
import type { Response } from 'express';
import {
  GoogleOauth2Service,
  type GoogleProfile,
} from './google-oauth2.service';
import { UserService } from '../user/user.service';
import { AuthGuard } from '@/common/guards/auth.guard';
import { GoogleLinkGuard } from './guards/google-link.guard';
import { appConfig } from '@/configs';
import type { ConfigType } from '@nestjs/config';

@Controller('auth/google')
export class GoogleOauth2Controller {
  constructor(
    private readonly googleOauth2Service: GoogleOauth2Service,
    private readonly userService: UserService,
    @Inject(appConfig.KEY)
    private readonly applicationConfig: ConfigType<typeof appConfig>,
  ) {}

  @Get()
  @UseGuards(AuthGuard, GoogleLinkGuard)
  async googleAuth() {
    // This initiates the Google OAuth2 flow with state
  }

  @Get('callback')
  @UseGuards(PassportAuthGuard('google'))
  async googleAuthRedirect(@Req() req: any, @Res() res: any) {
    // Extract userId from state
    const state = JSON.parse(req.query.state as string);
    const userId = state.userId as string;

    await this.googleOauth2Service.linkGoogleAccount(
      userId,
      req.user as GoogleProfile,
    );

    res.redirect(
      `${this.applicationConfig.clientUrl}${this.applicationConfig.googleRedirectPath}`,
    );
  }
}
