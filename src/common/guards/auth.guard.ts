import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtTokenService } from '@/modules/jwt-token/jwt-token.service';
import { KeyTokenService } from '@/modules/key-token/key-token.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtTokenService: JwtTokenService,
    private readonly keyTokenService: KeyTokenService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    // 1. Get userId from headers
    const userId = request.headers['x-client-id'] as string;
    if (!userId) {
      throw new UnauthorizedException('Missing x-client-id header');
    }

    // 2. Extract Token
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException('Missing authorization token');
    }

    // 3. Find KeyToken for user
    const keyToken = await this.keyTokenService.findByUserId(userId);
    if (
      !keyToken ||
      !keyToken.publicKeyHistory ||
      keyToken.publicKeyHistory.length === 0
    ) {
      throw new UnauthorizedException('User session not found or expired');
    }

    // 4. Verify Token with RSA Rotation Logic
    try {
      // Try the latest public key (index 0)
      const latestPublicKey = keyToken.publicKeyHistory[0];
      const payload = this.jwtTokenService.verifyToken(token, latestPublicKey);

      // Verification successful with current key
      request['user'] = payload;
      return true;
    } catch (error) {
      // 5. Check if it matches an older key in history (Intrusion Detection)
      for (let i = 1; i < keyToken.publicKeyHistory.length; i++) {
        try {
          const oldKey = keyToken.publicKeyHistory[i];
          this.jwtTokenService.verifyToken(token, oldKey);

          // If we reach here, it means the token is valid but used with an OLD key
          // This suggests a potential token reuse or stolen session
          await this.keyTokenService.handleIntrusion(userId);
          throw new UnauthorizedException(
            'Security alert: Old session token detected',
          );
        } catch (innerError) {
          // If verification fails with this old key too, continue searching
          if (
            innerError instanceof UnauthorizedException &&
            innerError.message.includes('Security alert')
          ) {
            throw innerError;
          }
          continue;
        }
      }

      // If we've exhausted the history and still no match
      throw new UnauthorizedException('Invalid token or expired session');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
