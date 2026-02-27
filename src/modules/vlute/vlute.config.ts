import { EnvUtil } from '@/common/utils/env.util';
import { EnvKey } from '@/configs/env.config';
import { registerAs } from '@nestjs/config';

export default registerAs('vlute', () => ({
  sso: {
    baseUrl: EnvUtil.getEnv(
      EnvKey.VLUTE_SSO_BASE_URL,
      false,
      'https://sso.vlute.edu.vn',
    ),
    realm: 'VLUTE',
    clientId: 'vlute.edu.vn',
    authEndpoint: '/auth/realms/VLUTE/protocol/openid-connect/auth',
    redirectUri: {
      daotao: 'https://daotao.vlute.edu.vn/sinh-vien/sso/callback',
      htql: 'https://htql.vlute.edu.vn/login/callback',
    },
    initialHeaders: {
      accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'accept-language': 'vi,en-US;q=0.9,en;q=0.8',
      'cache-control': 'max-age=0',
      priority: 'u=0, i',
      'sec-ch-ua':
        '"Not:A-Brand";v="99", "Google Chrome";v="145", "Chromium";v="145"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Linux"',
      'sec-fetch-dest': 'document',
      'sec-fetch-mode': 'navigate',
      'sec-fetch-site': 'same-site',
      'sec-fetch-user': '?1',
      'upgrade-insecure-requests': '1',
    },
  },
  api: {
    studentProfile: 'https://daotao.vlute.edu.vn/api/sinh-vien/ttsv',
    studentReferer: 'https://daotao.vlute.edu.vn/sinh-vien/thong-tin-sinh-vien',
  },
  form: {
    credentialId: '',
    loginAction: 'login',
  },
}));
