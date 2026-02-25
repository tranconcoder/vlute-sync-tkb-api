import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

import { ConfigModule } from '@nestjs/config';
import { HttpClientModule } from '../http-client/http-client.module';
import appConfig from '@/configs/app.config';

@Module({
  imports: [HttpClientModule, ConfigModule.forFeature(appConfig)],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
