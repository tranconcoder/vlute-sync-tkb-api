import { Inject, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import type { ConfigType } from '@nestjs/config';
import googleOauth2Config from './google-oauth2.config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    @Inject(googleOauth2Config.KEY)
    private readonly config: ConfigType<typeof googleOauth2Config>,
  ) {
    // eslint-disable-next-line
    super({
      clientID: config.clientId,
      clientSecret: config.clientSecret,
      callbackURL: config.callbackURL,
      scope: config.scope,
      accessType: config.accessType,
      prompt: config.prompt,
    } as any);
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    await Promise.resolve(); // satisfy async-await lint if needed, or make it non-async

    const { id, name, emails, photos } = profile;

    const user = {
      id,
      email: emails[0].value,
      firstName: name.givenName,
      lastName: name.familyName,
      picture: photos[0].value,
      _accessToken, // Optionally pass tokens
    };

    done(null, user);
  }
}
