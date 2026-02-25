import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validationSchema } from '@/common/validations/env.validation';
import configs from '@/configs';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from '../health/health.module';
import { MongodbModule } from '../mongodb/mongodb.module';

@Module({
  imports: [
    // Load config global
    ConfigModule.forRoot({
      isGlobal: true,
      load: configs,
      validationSchema,
    }),

    // MongoDB
    MongodbModule,

    // Health Check
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
