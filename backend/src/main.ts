import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // dev default: allow all; set CORS_ORIGINS=https://a.com,https://b.com to restrict
  app.enableCors({ origin: process.env.CORS_ORIGINS?.split(',') ?? true });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
