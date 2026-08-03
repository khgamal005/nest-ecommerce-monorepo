import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
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

  const config = new DocumentBuilder()
    .setTitle('Ecommerce API')
    .setDescription('Ecommerce monorepo backend API')
    .setVersion('1.0')
    .addCookieAuth('token')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3333;
  await app.listen(port);
  console.log(`Backend running on http://localhost:${port}/api`);
  console.log(`Swagger docs on http://localhost:${port}/api/docs`);
}

bootstrap();
