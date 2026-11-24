import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { createObserveModule } from '@nestjs/observe';
import { ScheduleModule } from '@nestjs/schedule';
import { ApplicationsModule } from './applications/applications.module.js';
import { AuthenticationModule } from './authentication/authentication.module.js';
import { JobModule } from './jobs/jobs.module.js';
import { UsersModule } from './users/users.module.js';
import { CompanyModule } from './company/company.module.js';
import { NotificationsModule } from './notification/notification.module.js';
import { ReportsModule } from './reports/reports.module.js';
import { AdminModerationAndReports20261116100000 } from './database/migrations/20261116100000-AdminModerationAndReports.js';
import { ApplicationDocumentsAndLifecycle20261118100000 } from './database/migrations/20261118100000-ApplicationDocumentsAndLifecycle.js';
import { AdminAuditLogs20261124170000 } from './database/migrations/20261124170000-AdminAuditLogs.js';

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
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'oracle' as const,
        host: config.get<string>('DB_HOST'),
        port: Number(config.get<string>('DB_PORT') ?? 1521),
        serviceName: config.get<string>('DB_SERVICE_NAME'),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        migrations: [
          AdminModerationAndReports20261116100000,
          ApplicationDocumentsAndLifecycle20261118100000,
          AdminAuditLogs20261124170000,
        ],
        migrationsRun: false,
        autoLoadEntities: true,
        synchronize: config.get<string>('DB_SYNCHRONIZE') === 'true',
      }),
    }),

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
    NotificationsModule,
    ReportsModule,
    ApplicationsModule,
    CompanyModule,
  ],
})
export class AppModule {}
