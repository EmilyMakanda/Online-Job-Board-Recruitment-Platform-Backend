import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Online Job Board API')
    .setDescription('Online Job Board Recruitment Platform')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api', app, document, {
    customSiteTitle: 'Online Job Board API',
    customCss: `
      :root {
        --swagger-blue: #123d73;
        --swagger-gold: #d4af37;
      }
      body {
        background: #f5f8fc;
      }
      .swagger-ui .topbar {
        background: linear-gradient(90deg, #123d73, #1f5b99);
        border-bottom: 4px solid #d4af37;
      }
      .swagger-ui .topbar a span {
        color: #ffffff;
      }
      .swagger-ui .info .title,
      .swagger-ui .opblock-tag,
      .swagger-ui .scheme-container {
        color: #123d73;
      }
      .swagger-ui .opblock.opblock-get {
        background: rgba(18, 61, 115, 0.08);
        border-color: #123d73;
      }
      .swagger-ui .opblock.opblock-post {
        background: rgba(212, 175, 55, 0.12);
        border-color: #d4af37;
      }
      .swagger-ui .opblock.opblock-put,
      .swagger-ui .opblock.opblock-patch {
        background: rgba(18, 61, 115, 0.12);
        border-color: #123d73;
      }
      .swagger-ui .opblock.opblock-delete {
        background: rgba(154, 44, 44, 0.08);
        border-color: #9a2c2c;
      }
      .swagger-ui .btn.execute,
      .swagger-ui .btn.authorize {
        background: #123d73;
        border-color: #123d73;
        color: #ffffff;
      }
      .swagger-ui .btn.execute:hover,
      .swagger-ui .btn.authorize:hover {
        background: #d4af37;
        border-color: #d4af37;
        color: #123d73;
      }
      .swagger-ui .model-title,
      .swagger-ui table thead tr td,
      .swagger-ui table thead tr th {
        color: #123d73;
      }
    `,
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();