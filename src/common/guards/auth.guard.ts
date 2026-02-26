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

    // 1. Extract Token (prefer cookie, fallback to Authorization header)
    const token = this.extractToken(request);
    if (!token) {
      throw new UnauthorizedException('Missing authentication token');
    }

    // 2. Decode token to get userId (without verification first)
    let userId: string;
    try {
      const decoded = JSON.parse(
        Buffer.from(token.split('.')[1], 'base64').toString(),
      );
      userId = decoded.userId;
    } catch {
      throw new UnauthorizedException('Malformed token');
    }

    if (!userId) {
      throw new UnauthorizedException('Token missing userId');
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

          // Valid with OLD key → potential token reuse
          await this.keyTokenService.handleIntrusion(userId);
          throw new UnauthorizedException(
            'Security alert: Old session token detected',
          );
        } catch (innerError) {
          if (
            innerError instanceof UnauthorizedException &&
            innerError.message.includes('Security alert')
          ) {
            throw innerError;
          }
          continue;
        }
      }

      // Exhausted history with no match
      throw new UnauthorizedException('Invalid token or expired session');
    }
  }

  /**
   * Extract token from cookie first, then fallback to Authorization header
   */
  private extractToken(request: Request): string | undefined {
    // 1. Try cookie
    const cookieToken = request.cookies?.accessToken;
    if (cookieToken) return cookieToken;

    // 2. Fallback to Bearer header
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
