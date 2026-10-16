import { Module } from '@nestjs/common';
import { createObserveModule } from '@nestjs/observe';
import { ConfigModule, ConfigService} from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ApplicationsModule } from './applications/applications.module.js';
import { JobModule } from './jobs/jobs.module.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    // Distributed tracing, auto-correlated logs, request/job metrics, error
    // telemetry, alarms, and more — out of the box. Sign up at https://observe.nestjs.com
    ObserveModule.forRoot({
      appKey: 'YOUR_APP_KEY',
      appSecret: 'YOUR_APP_SECRET',
      serviceId: 'jo-board-backend',
    }),
    // Loads environment variables from .env file and makes them globally available
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Connects NestJS to the database using TypeORM. The configuration is loaded from environment variables.
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'oracle',
        host: configService.get<string>('DB_HOST','localhost'),
        port: configService.get<number>('DB_PORT', 1521),
        username: configService.get<string>('DB_USERNAME','job_board_user'),
        password: configService.get<string>('DB_PASSWORD','JobBoardPassword123!'),
        serviceName: configService.get<string>('DB_SERVICE_NAME','job_board_pdb'),
      }),
    }),
    ApplicationsModule,
    JobModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
