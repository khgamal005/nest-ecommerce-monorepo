import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { ValidationError } from 'class-validator';
import { AppModule } from './app.module';

function flattenValidationErrors(
  errors: ValidationError[],
  parent = '',
): { field: string; message: string }[] {
  const result: { field: string; message: string }[] = [];
  for (const error of errors) {
    const field = parent ? `${parent}.${error.property}` : error.property;
    if (error.constraints) {
      const message = Object.values(error.constraints)[0];
      result.push({ field, message });
    }
    if (error.children?.length) {
      result.push(...flattenValidationErrors(error.children, field));
    }
  }
  return result;
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(cookieParser());

  app.setGlobalPrefix('api');

  // Allow base64 image payloads (e.g. banner uploads) in JSON bodies.
  app.useBodyParser('json', { limit: '20mb' });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      exceptionFactory: (errors) => {
        const fieldErrors = flattenValidationErrors(errors);
        return new BadRequestException({
          message: fieldErrors,
          errors: fieldErrors,
          statusCode: 400,
        });
      },
    }),
  );

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
