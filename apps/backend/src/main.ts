import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // CORS: allow both frontend origins (main domain + admin subdomain)
  app.enableCors({
    origin: [process.env.USER_WEB_URL ?? 'http://localhost:3000', process.env.ADMIN_URL ?? 'http://localhost:3001'],
    credentials: true,
  });

  const port = process.env.PORT ?? 3333;
  await app.listen(port);
  console.log(`Backend running on http://localhost:${port}/api`);
}

bootstrap();
