import { TypeOrmModule } from '@nestjs/typeorm';
import { createObserveModule } from '@nestjs/observe';
import { ConfigModule, ConfigService} from '@nestjs/config';                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';                                                                                                                                                                                                                                                                                             
import { ApplicationsModule } from './applications/applications.module.js';
import { Module } from '@nestjs/common';
import { AuthenticationModule } from './authentication/authentication.module.js';
import { JobModule } from './jobs/jobs.module.js';
import { UsersModule } from './users/users.module.js';
import { CompanyModule } from './company/company.module.js';

const configModule = ConfigModule.forRoot({
  isGlobal: true,
});
export const { ObserveModule, ObserveInstrument } = createObserveModule();
const observeEnabled = process.env.OBSERVE_ENABLED === 'true';
const observeAppKey = process.env.OBSERVE_APP_KEY || 'YOUR_APP_KEY';
const observeAppSecret = process.env.OBSERVE_APP_SECRET || 'YOUR_APP_SECRET';

if(observeAppKey && (!observeAppKey || !observeAppSecret)) {
  throw new Error(
    'OBSERVE_ENABLED is true, but OBSERVE_APP_KEY or OBSERVE_APP_SECRET is missing',
  );
}

@Module({
  imports: [
    configModule,

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'oracle' as const,
        host: config.get<string>('DB_HOST'),
        port: Number(config.get<string>('DB_PORT') ?? 1521),
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

    ...(observeEnabled
      ? [
          ObserveModule.forRoot({
            appKey: 'YOUR_APP_KEY',
            appSecret: 'YOUR_APP_SECRET',
            serviceId: 'jo-board-backend',
          }),
        ]
      : []),

    AuthenticationModule,
    JobModule,
    UsersModule,
    CompanyModule,
    
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
