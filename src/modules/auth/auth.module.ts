import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { HttpClientModule } from '../http-client/http-client.module';
import { StudentModule } from '../student/student.module';
import { UserModule } from '../user/user.module';
import { KeyTokenModule } from '../key-token/key-token.module';
import appConfig from '@/configs/app.config';

@Module({
  imports: [
    HttpClientModule,
    ConfigModule.forFeature(appConfig),
    StudentModule,
    UserModule,
    KeyTokenModule,
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
