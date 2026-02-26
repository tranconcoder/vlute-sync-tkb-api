import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './modules/app/app.module';
import { EnvUtil } from './common/utils/env.util';
import { EnvKey } from './configs/env.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const PORT = EnvUtil.getEnv(EnvKey.PORT, false, 3000);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors();
  await app.listen(PORT);
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
