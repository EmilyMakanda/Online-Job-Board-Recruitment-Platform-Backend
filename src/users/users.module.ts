
import { Module } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { AuthenticationModule } from '../authentication/authentication.module.js';
import { UsersController } from './users.controller.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../authentication/entities/user.entity.js';
@Module({
  imports: [TypeOrmModule.forFeature([ User ])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
