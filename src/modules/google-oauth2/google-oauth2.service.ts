import { Injectable } from '@nestjs/common';
import { KeyTokenService } from '../key-token/key-token.service';
import { UserService } from '../user/user.service';

export interface GoogleProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  picture: string;
}

@Injectable()
export class GoogleOauth2Service {
  constructor(
    private readonly userService: UserService,
    private readonly keyTokenService: KeyTokenService,
  ) {}

  async linkGoogleAccount(userId: string, googleUser: GoogleProfile) {
    const user = await this.userService.linkGoogleAccount(userId, {
      id: googleUser.id,
      name: `${googleUser.lastName} ${googleUser.firstName}`,
      email: googleUser.email,
      avatar: googleUser.picture,
    });

    if (!user) {
      throw new Error('Không tìm thấy tài khoản để liên kết.');
    }

    return user;
  }
}
