import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import type { ConfigType } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import mongodbConfig from './mongodb.config';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule.forFeature(mongodbConfig)], // 👈 inject config vào đây
      inject: [mongodbConfig.KEY],
      useFactory: (config: ConfigType<typeof mongodbConfig>) => ({
        uri: config.url,
      }),
    }),
  ],
  exports: [MongooseModule],
})
export class MongodbModule {}
