import { Module } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { UsersController } from './users.controller.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Jobseeker } from './entities/jobseeker.entity.js';
import { Employer } from './entities/employer.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Jobseeker, Employer])],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
