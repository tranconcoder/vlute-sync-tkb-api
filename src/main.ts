import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './modules/app/app.module';
import { EnvUtil } from './common/utils/env.util';
import { EnvKey } from './configs/env.config';
import { AllExceptionsFilter } from './core/filters/all-exceptions.filter';
import cookieParser from 'cookie-parser';

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

  app.useGlobalFilters(new AllExceptionsFilter());

  app.use(cookieParser());

  app.enableCors({
    origin: EnvUtil.getEnv(EnvKey.CORS_ORIGIN, false, 'http://localhost:3001'),
    credentials: true,
  });

  await app.listen(PORT);
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
