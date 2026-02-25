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
});
