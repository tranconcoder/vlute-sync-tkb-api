import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtTokenService } from './jwt-token.service';
import jwtTokenConfig from './jwt-token.config';

@Global()
@Module({
  imports: [ConfigModule.forFeature(jwtTokenConfig)],
  providers: [JwtTokenService],
  exports: [JwtTokenService],
})
export class JwtTokenModule {}
