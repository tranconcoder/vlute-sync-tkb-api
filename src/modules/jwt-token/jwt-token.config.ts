import { registerAs } from '@nestjs/config';

export const JWT_TOKEN_NAMESPACE = 'jwt_token';

export default registerAs(JWT_TOKEN_NAMESPACE, () => ({
  accessTokenExpiresIn: '10m',
  refreshTokenExpiresIn: '7d',
}));
