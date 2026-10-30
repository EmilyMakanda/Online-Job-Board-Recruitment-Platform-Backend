import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createObserveModule } from '@nestjs/observe';

import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

import { ApplicationsModule } from './applications/applications.module.js';
import { AuthenticationModule } from './authentication/authentication.module.js';
import { JobModule } from './jobs/jobs.module.js';
import { UsersModule } from './users/users.module.js';
import { CompanyModule } from './company/company.module.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

const observeEnabled = process.env.OBSERVE_ENABLED === 'true';
const observeAppKey = process.env.OBSERVE_APP_KEY;
const observeAppSecret = process.env.OBSERVE_APP_SECRET;

if (observeEnabled && (!observeAppKey || !observeAppSecret)) {
  throw new Error(
    'OBSERVE_ENABLED is true, but OBSERVE_APP_KEY or OBSERVE_APP_SECRET is missing.',
  );
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return {
          type: 'oracle' as const,
          host: config.get<string>('DB_HOST'),
          port: Number(config.get<string>('DB_PORT') ?? 1521),
          serviceName: config.get<string>('DB_SERVICE_NAME'),
          username: config.get<string>('DB_USERNAME'),
          password: config.get<string>('DB_PASSWORD'),
          autoLoadEntities: true,
          synchronize: config.get<string>('DB_SYNCHRONIZE') === 'true',
        };
      },
    }),
    ConfigModule.forRoot({ isGlobal: true}),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
  console.log('Database config check:', {
    host: config.get<string>('DB_HOST'),
  port: config.get<string>('DB_PORT'),
  serviceName: config.get<string>('DB_SERVICE_NAME'),
  username: config.get<string>('DB_USERNAME'),
  hasPassword: Boolean(config.get<string>('DB_PASSWORD')),
  });

    ApplicationsModule,

    ...(observeEnabled
      ? [
          ObserveModule.forRoot({
            appKey: observeAppKey!,
            appSecret: observeAppSecret!,
            serviceId: 'jo-board-backend',
          }),
        ]
      : []),

    ApplicationsModule,
    AuthenticationModule,
    JobModule,
    UsersModule,
    CompanyModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}