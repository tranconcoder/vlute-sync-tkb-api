import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EncryptionService } from './encryption.service';
import appConfig from '@/configs/app.config';

@Global()
@Module({
  imports: [ConfigModule.forFeature(appConfig)],
  providers: [EncryptionService],
  exports: [EncryptionService],
})
export class EncryptionModule {}
