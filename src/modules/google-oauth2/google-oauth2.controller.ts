import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard as PassportAuthGuard } from '@nestjs/passport';
import { GoogleOauth2Service } from './google-oauth2.service';
import { OkResponse } from '@/core/response';
import { UserService } from '../user/user.service';
import { AuthGuard } from '@/common/guards/auth.guard';
import { GoogleLinkGuard } from './guards/google-link.guard';

@Controller('auth/google')
export class GoogleOauth2Controller {
  constructor(
    private readonly googleOauth2Service: GoogleOauth2Service,
    private readonly userService: UserService,
  ) {}

  @Get()
  @UseGuards(AuthGuard, GoogleLinkGuard)
  async googleAuth() {
    // This initiates the Google OAuth2 flow with state
  }

  @Get('callback')
  @UseGuards(PassportAuthGuard('google'))
  async googleAuthRedirect(@Req() req: any) {
    // Extract userId from state
    const state = JSON.parse(req.query.state as string);
    const userId = state.userId as string;

    const user = await this.googleOauth2Service.linkGoogleAccount(
      userId,
      req.user,
    );

    return new OkResponse({
      message: 'Liên kết tài khoản Google thành công',
      data: this.userService.getUserLoginInfo(user),
    });
  }
}
