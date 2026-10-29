
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthenticationModule } from '../authentication/authentication.module.js';
import { User } from '../authentication/entities/user.entity.js';
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
