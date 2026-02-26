import { EnvKey } from '@/configs/env.config';
import * as Joi from 'joi';

export const validationSchema = Joi.object({
  // App
  [EnvKey.NODE_ENV]: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  [EnvKey.PORT]: Joi.number().default(3000),
  [EnvKey.BASE_SERVER_URL]: Joi.string().uri().required(),
  [EnvKey.BASE_CLIENT_URL]: Joi.string().uri().required(),
  [EnvKey.STUDENT_EMAIL_SUFFIX]: Joi.string().optional(),

  // Redis
  [EnvKey.REDIS_URL]: Joi.string().required(),

  // MongoDB
  [EnvKey.MONGO_URL]: Joi.string().required(),

  // HttpClient
  [EnvKey.VLUTE_SSO_BASE_URL]: Joi.string().uri().required(),

  // Encryption
  [EnvKey.MASTER_ENCRYPTION_KEY]: Joi.string().required(),

  // Cors
  [EnvKey.CORS_ORIGIN]: Joi.string().required(),

  // Google OAuth2
  [EnvKey.GOOGLE_CLIENT_ID]: Joi.string().required(),
  [EnvKey.GOOGLE_CLIENT_SECRET]: Joi.string().required(),
  [EnvKey.GOOGLE_CALLBACK_PATH]: Joi.string().required(),
  [EnvKey.GOOGLE_CLIENT_REDIRECT_URL]: Joi.string().required(),
});
