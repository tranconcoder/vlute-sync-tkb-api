import { registerAs } from '@nestjs/config';
import { EnvUtil } from 'src/common/utils/env.util';
import { EnvKey } from './env.config';

export interface IRedisConfig {
  url: string;
}

export default registerAs(
  'redis',
  (): IRedisConfig => ({
    url: EnvUtil.getEnv(EnvKey.REDIS_URL, true),
  }),
);
