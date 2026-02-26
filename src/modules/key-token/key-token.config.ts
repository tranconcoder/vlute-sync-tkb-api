import { registerAs } from '@nestjs/config';
import { EnvKey } from '@/configs/env.config';
import { EnvUtil } from '@/common/utils/env.util';

export const KEY_TOKEN_NAMESPACE = 'key_token';

export default registerAs(KEY_TOKEN_NAMESPACE, () => ({
  keyEncryptVluteToken: EnvUtil.getEnv(EnvKey.MASTER_ENCRYPTION_KEY),
}));
