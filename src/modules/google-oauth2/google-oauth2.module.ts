import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { GoogleOauth2Service } from './google-oauth2.service';
import { GoogleOauth2Controller } from './google-oauth2.controller';
import { GoogleStrategy } from './google-oauth2.strategy';
import { UserModule } from '../user/user.module';
import { KeyTokenModule } from '../key-token/key-token.module';
import googleOauth2Config from './google-oauth2.config';

@Module({
  imports: [
    ConfigModule.forFeature(googleOauth2Config),
    PassportModule.register({ defaultStrategy: 'google' }),
    UserModule,
    KeyTokenModule,
  ],
  controllers: [GoogleOauth2Controller],
  providers: [GoogleOauth2Service, GoogleStrategy],
})
export class GoogleOauth2Module {}
