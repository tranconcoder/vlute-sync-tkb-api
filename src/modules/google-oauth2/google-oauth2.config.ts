import { registerAs } from '@nestjs/config';
import { EnvUtil } from '@/utils/env.util';
import { EnvKey } from '../../configs/env.config';

export const GOOGLE_OAUTH2_CONFIG_NAMESPACE = 'google-oauth2';

export default registerAs(GOOGLE_OAUTH2_CONFIG_NAMESPACE, () => {
  const baseUrl = EnvUtil.getEnv(EnvKey.BASE_SERVER_URL, true);
  const callbackPath = EnvUtil.getEnv(EnvKey.GOOGLE_CALLBACK_PATH, true);

  return {
    clientId: EnvUtil.getEnv(EnvKey.GOOGLE_CLIENT_ID, true),
    clientSecret: EnvUtil.getEnv(EnvKey.GOOGLE_CLIENT_SECRET, true),
    callbackURL: `${baseUrl}${callbackPath}`,
    scope: ['email', 'profile', 'https://www.googleapis.com/auth/calendar'],
    accessType: 'offline',
    prompt: 'consent',
  };
});
