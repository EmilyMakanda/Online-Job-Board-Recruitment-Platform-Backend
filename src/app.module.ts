import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';
import { createObserveModule } from '@nestjs/observe';
import { ConfigModule, ConfigService} from '@nestjs/config';                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ApplicationsModule } from './applications/applications.module.js';

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
        synchronize: false,
      }),
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

  return {
    type: 'oracle' as const,
    host: config.get<string>('DB_HOST'),
    port: config.get<number>('DB_PORT'),
    serviceName: config.get<string>('DB_SERVICE_NAME'),
    username: config.get<string>('DB_USERNAME'),
    password: config.get<string>('DB_PASSWORD'),
    autoLoadEntities: true,
    synchronize: config.get<string>('DB_SYNCHRONIZE') === 'true',
  };
},
 }),
    ObserveModule.forRoot({

      appKey: 'YOUR_APP_KEY',
      appSecret: 'YOUR_APP_SECRET',
      serviceId: 'jo-board-backend',
    }),
  
    ApplicationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
