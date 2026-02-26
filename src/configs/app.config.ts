import { registerAs } from '@nestjs/config';
import { EnvUtil } from '@/utils/env.util';
import { EnvKey } from './env.config';

export const APP_CONFIG_NAMESPACE = 'app';

export default registerAs(APP_CONFIG_NAMESPACE, () => ({
  nodeEnv: EnvUtil.getEnv(EnvKey.NODE_ENV, false, 'development'),
  port: EnvUtil.getEnv(EnvKey.PORT, false, 3000, Number),
  baseUrl: EnvUtil.getEnv(EnvKey.BASE_SERVER_URL, true),
  studentEmailSuffix: '@st.vlute.edu.vn',
  userAgent:
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
  masterEncryptionKey: EnvUtil.getEnv(EnvKey.MASTER_ENCRYPTION_KEY, true),
}));
