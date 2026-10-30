import { Module } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { AuthenticationModule } from '../authentication/authentication.module.js';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';

@Module({
  imports: [AuthenticationModule, TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}