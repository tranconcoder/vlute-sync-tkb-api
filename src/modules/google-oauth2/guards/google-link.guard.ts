import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard as PassportAuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleLinkGuard extends PassportAuthGuard('google') {
  getAuthenticateOptions(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    // Pass userId through state to Google
    return {
      state: JSON.stringify({ userId: request.user.userId }),
    };
  }
}
