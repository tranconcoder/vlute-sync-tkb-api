import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import type { ConfigType } from '@nestjs/config';
import Redis from 'ioredis';
import redisConfig from './redis.config';

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Module({
  imports: [ConfigModule.forFeature(redisConfig)],
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [redisConfig.KEY],
      useFactory: (config: ConfigType<typeof redisConfig>) =>
        new Redis(config.url as string),
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
