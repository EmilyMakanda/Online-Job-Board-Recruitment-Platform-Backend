
import { Module } from '@nestjs/common';
import { AuthenticationModule } from './authentication/authentication.module.js';
import { JobModule } from './jobs/jobs.module.js';
import { UsersModule } from './users/users.module.js';
import { NotificationsModule } from './notification/notification.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
const configModule = ConfigModule.forRoot({
  isGlobal: true,
});

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
        synchronize: config.get<string>('DB_SYNCHRONIZE') === 'false',
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
    synchronize: false,
  };
},
 }),
    AuthenticationModule,
    JobModule,
    UsersModule,
    NotificationsModule,
    
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
