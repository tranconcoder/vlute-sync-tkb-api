import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { HttpClientModule } from '../http-client/http-client.module';
import { StudentModule } from '../vlute/user/student/student.module';
import { UserModule } from '../user/user.module';
import { KeyTokenModule } from '../key-token/key-token.module';
import { VluteLoginModule } from '../vlute/login/login.module';
import appConfig from '@/configs/app.config';

@Module({
  imports: [
    HttpClientModule,
    ConfigModule.forFeature(appConfig),
    StudentModule,
    UserModule,
    KeyTokenModule,
    VluteLoginModule,
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
