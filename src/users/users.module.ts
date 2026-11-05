import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '../authentication/entities/user.entity.js';
import { UsersService } from './users.service.js';
import { UsersController } from './users.controller.js';
import { AuthenticationModule } from '../authentication/authentication.module.js';

@Module({
  imports: [AuthenticationModule, TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}