import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app/app.module';
import { EnvUtil } from './common/utils/env.util';
import { EnvKey } from './configs/env.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const PORT = EnvUtil.getEnv(EnvKey.PORT, false, 3000);

  app.enableCors();
  await app.listen(PORT);
}

bootstrap();
