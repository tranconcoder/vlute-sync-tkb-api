import { registerAs } from '@nestjs/config';
import { EnvUtil } from '@/utils/env.util';
import { EnvKey } from './env.config';

export const REDIS_CONFIG_NAMESPACE = 'redis';

export default registerAs(REDIS_CONFIG_NAMESPACE, () => ({
  url: EnvUtil.getEnv(EnvKey.REDIS_URL, true),
}));
