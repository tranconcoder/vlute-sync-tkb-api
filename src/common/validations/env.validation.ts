import * as Joi from 'joi';

export const validationSchema = Joi.object({
  // App
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),

  // Redis
  REDIS_URL: Joi.string().required(),

  // MongoDB
  MONGO_URL: Joi.string().required(),

  // HttpClient
  VLUTE_SSO_BASE_URL: Joi.string().uri().required(),

  // Google OAuth2
  BASE_SERVER_URL: Joi.string().uri().required(),
  GOOGLE_CLIENT_ID: Joi.string().required(),
  GOOGLE_CLIENT_SECRET: Joi.string().required(),
  GOOGLE_CALLBACK_PATH: Joi.string().required(),
});
