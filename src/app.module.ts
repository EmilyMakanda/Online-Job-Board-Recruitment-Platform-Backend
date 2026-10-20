import { Module } from '@nestjs/common';

import { createObserveModule } from '@nestjs/observe';
import { ConfigModule, ConfigService} from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ApplicationsModule } from './applications/applications.module.js';
<<<<<<< HEAD
<<<<<<< HEAD
import { JobModule } from './jobs/jobs.module.js';
=======
import { UsersModule } from './users/users.module.js';
>>>>>>> main
=======
import { JobModule } from './jobs/jobs.module.js';
import { UsersModule } from './users/users.module.js';
>>>>>>> d627619025ca16e0275e4356af0d7c4aad1f780e

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true}),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'oracle',
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        serviceName: config.get<string>('DB_SERVICE_NAME'),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        autoLoadEntities: true,
        synchronize: config.get<string>('DB_SYNCHRONIZE') === 'true',
      }),
    }),
    ObserveModule.forRoot({
      appKey: 'YOUR_APP_KEY',
      appSecret: 'YOUR_APP_SECRET',
      serviceId: 'jo-board-backend',
    }),
  
    ApplicationsModule,
<<<<<<< HEAD
<<<<<<< HEAD
    JobModule,
=======
    UsersModule,
>>>>>>> main
=======
    JobModule,
    UsersModule,
>>>>>>> d627619025ca16e0275e4356af0d7c4aad1f780e
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
