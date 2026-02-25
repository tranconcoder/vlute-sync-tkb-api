import { registerAs } from '@nestjs/config';
import { EnvUtil } from '@/common/utils/env.util';
import { EnvKey } from '@/configs/env.config';

export const HTTP_CLIENT_CONFIG_NAMESPACE = 'http-client';

export default registerAs(HTTP_CLIENT_CONFIG_NAMESPACE, () => ({
  vLuteSsoBaseUrl: EnvUtil.getEnv(EnvKey.VLUTE_SSO_BASE_URL, true),
}));
