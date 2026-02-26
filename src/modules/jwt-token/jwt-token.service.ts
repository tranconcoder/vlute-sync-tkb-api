import {
  Inject,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { JwtPayload } from './jwt-token.types';
import jwtTokenConfig from './jwt-token.config';

@Injectable()
export class JwtTokenService {
  constructor(
    @Inject(jwtTokenConfig.KEY)
    private readonly config: ConfigType<typeof jwtTokenConfig>,
  ) {}

  /**
   * Create a pair of Access Token and Refresh Token
   */
  createJwtPair(
    payload: JwtPayload,
    privateKey: string,
    publicKey: string,
  ): { accessToken: string; refreshToken: string; publicKey: string } {
    const accessToken = this.signToken(
      payload,
      privateKey,
      this.config.accessTokenExpiresIn,
    );
    const refreshToken = this.signToken(
      payload,
      privateKey,
      this.config.refreshTokenExpiresIn,
    );

    return { accessToken, refreshToken, publicKey };
  }

  /**
   * Sign a new JWT using RS256 algorithm
   */
  signToken(
    payload: JwtPayload,
    privateKey: string,
    expiresIn: string | number,
  ): string {
    try {
      // Cast payload to object to avoid sign overload issues with Buffer/string
      return jwt.sign({ ...payload }, privateKey, {
        algorithm: 'RS256',
        expiresIn: expiresIn as any,
      });
    } catch (error) {
      throw new InternalServerErrorException(
        `Error signing JWT token: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
    }
  }

  /**
   * Verify and decode a JWT using RSA Public Key
   */
  verifyToken(token: string, publicKey: string): JwtPayload {
    try {
      const decoded = jwt.verify(token, publicKey, {
        algorithms: ['RS256'],
      }) as JwtPayload;
      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedException('Token has expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedException('Invalid token');
      }
      throw new UnauthorizedException('Authentication failed');
    }
  }

  /**
   * Decode JWT without verification
   */
  decodeToken(token: string): JwtPayload | null {
    try {
      return jwt.decode(token) as JwtPayload;
    } catch {
      return null;
    }
  }
}
