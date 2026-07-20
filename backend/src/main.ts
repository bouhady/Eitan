import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors(); // ponytail: allow all origins for dev; restrict when deployed
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
