import { Module } from '@nestjs/common';
import { HttpClientService } from './http-client.service';
import { HttpClientController } from './http-client.controller';

import { ConfigModule } from '@nestjs/config';
import httpClientConfig from './http-client.config';

@Module({
  imports: [ConfigModule.forFeature(httpClientConfig)],
  controllers: [HttpClientController],
  providers: [HttpClientService],
  exports: [HttpClientService],
})
export class HttpClientModule {}
