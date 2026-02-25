import { registerAs } from '@nestjs/config';
import { EnvUtil } from '@/utils/env.util';
import { EnvKey } from './env.config';

export const MONGO_CONFIG_NAMESPACE = 'mongo';

export default registerAs(MONGO_CONFIG_NAMESPACE, () => ({
  url: EnvUtil.getEnv(EnvKey.MONGO_URL, true),
}));
