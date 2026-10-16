import { NestFactory } from '@nestjs/core';
import { AppModule, ObserveInstrument } from './app.module.js';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });
  await app.listen(process.env.PORT ?? 3001);
}

const swaggerConfig = new DocumentBuilder()
  .setTitle('Job Board API')
  .setDescription('API documentation for the Job Board application')
  .setVersion('1.0')
  .build();

const document = SwaggerModule.createDocument(AppModule, swaggerConfig);
SwaggerModule.setup('api', app, document);
await bootstrap();
