import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { KeyToken, KeyTokenSchema } from './entities/key-token.entity';
import { KeyTokenService } from './key-token.service';
import { KeyTokenController } from './key-token.controller';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: KeyToken.name, schema: KeyTokenSchema },
    ]),
    RedisModule,
  ],
  controllers: [KeyTokenController],
  providers: [KeyTokenService],
  exports: [KeyTokenService],
})
export class KeyTokenModule {}
