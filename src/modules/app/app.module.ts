import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { validationSchema } from '@/validations/env.validation';
import { MONGO_CONFIG_NAMESPACE } from '@/configs/mongo.config';
import configs from '@/configs';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from '../health/health.module';

@Module({
  imports: [
    // Load config
    ConfigModule.forRoot({
      isGlobal: true,
      load: configs,
      validationSchema,
    }),

    // Connect to mongodb
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>(`${MONGO_CONFIG_NAMESPACE}.url`),
      }),
    }),

    // Health Check
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
