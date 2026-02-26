import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoginService } from './login.service';
import { HttpClientModule } from '../../http-client/http-client.module';
import vluteConfig from '../vlute.config';

@Module({
  imports: [HttpClientModule, ConfigModule.forFeature(vluteConfig)],
  providers: [LoginService],
  exports: [LoginService, ConfigModule.forFeature(vluteConfig)],
})
export class VluteLoginModule {}
