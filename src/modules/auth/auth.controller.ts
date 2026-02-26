import {
  Controller,
  Post,
  Get,
  Body,
  Res,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from '@/common/guards/auth.guard';
import { OkResponse, UnauthorizedError } from '@/core/response';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userInfo = await this.authService.login(
      loginDto.student_id,
      loginDto.password,
      res,
    );

    return new OkResponse({
      message: 'Đăng nhập thành công',
      data: userInfo,
    });
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const userId = (req as any).user.userId;
    await this.authService.logout(userId, res);
    return new OkResponse({ message: 'Đăng xuất thành công' });
  }

  @Post('refresh')
  async refreshToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      throw new UnauthorizedError('Missing refresh token');
    }

    const result = await this.authService.refreshToken(refreshToken, res);
    return new OkResponse({
      message: 'Token refreshed successfully',
      data: result,
    });
  }

  @Get('me')
  @UseGuards(AuthGuard)
  async me(@Req() req: Request) {
    const payload = req['user'] as { userId: string };
    const userInfo = await this.authService.getMe(payload.userId);

    return new OkResponse({
      message: 'User info',
      data: userInfo,
    });
  }
}
