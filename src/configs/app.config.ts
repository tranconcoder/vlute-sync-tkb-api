import { registerAs } from '@nestjs/config';
import { EnvUtil } from '@/utils/env.util';
import { EnvKey } from './env.config';

export const APP_CONFIG_NAMESPACE = 'app';

export default registerAs(APP_CONFIG_NAMESPACE, () => ({
  nodeEnv: EnvUtil.getEnv(EnvKey.NODE_ENV, false, 'development'),
  port: EnvUtil.getEnv(EnvKey.PORT, false, 3000, Number),
}));
