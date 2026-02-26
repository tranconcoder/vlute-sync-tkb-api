import { registerAs } from '@nestjs/config';

export default registerAs('vlute', () => ({
  sso: {
    baseUrl: process.env.SSO_BASE_URL || 'https://sso.vlute.edu.vn',
    realm: 'VLUTE',
    clientId: 'vlute.edu.vn',
    authEndpoint: '/auth/realms/VLUTE/protocol/openid-connect/auth',
    redirectUri: {
      daotao: 'https://daotao.vlute.edu.vn/sinh-vien/sso/callback',
      htql: 'https://htql.vlute.edu.vn/login/callback',
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
