import { NestFactory } from '@nestjs/core';
import {ValidationPipe} from '@nestjs/common';
import {DocumentBuilder, SwaggerModule} from '@nestjs/swagger';
import { AppModule, ObserveInstrument } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
   const swaggerConfig = new DocumentBuilder()
       .setTitle('Online Job Board Api')
       .setDescription('Recruitment platform backend - Group CC6')
       .setVersion('1.0')
       .addBearerAuth()
       .build();
   const document = SwaggerModule.createDocument(app, swaggerConfig);
   SwaggerModule.setup('docs', app, document);
   
  await app.listen(process.env.PORT ?? 3000);
}

const swaggerConfig = new DocumentBuilder()
  .setTitle('Job Board API')
  .setDescription('API documentation for the Job Board application')
  .setVersion('1.0')
  .build();
  
await bootstrap();
