
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthenticationModule } from './authentication/authentication.module.js';
import { ApplicationsModule } from './applications/applications.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'oracle' as const,
        host: configService.get<string>('DB_HOST'),
        port: Number(configService.get('DB_PORT') ?? 1521),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        serviceName: configService.get<string>('DB_SERVICE_NAME'),
        autoLoadEntities: true,
        synchronize: true,
      }),
    }),

    AuthenticationModule,
    ApplicationsModule,
  ],
})
export class AppModule {}
