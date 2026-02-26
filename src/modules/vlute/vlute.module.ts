import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { VluteLoginModule } from './login/login.module';
import { VluteUserModule } from './user/user.module';
import vluteConfig from './vlute.config';

@Module({
  imports: [
    VluteLoginModule,
    VluteUserModule,
    ConfigModule.forFeature(vluteConfig),
  ],
  exports: [
    VluteLoginModule,
    VluteUserModule,
    ConfigModule.forFeature(vluteConfig),
  ],
})
export class VluteModule {}
