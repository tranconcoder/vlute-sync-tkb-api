import appConfig from './app.config';
import mongoConfig from './mongo.config';
import redisConfig from './redis.config';

export { default as appConfig } from './app.config';
export { default as redisConfig } from './redis.config';
export { default as mongoConfig } from './mongo.config';

export default [appConfig, redisConfig, mongoConfig];
