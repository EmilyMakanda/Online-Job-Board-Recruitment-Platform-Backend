import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../authentication/entities/user.entity.js';
import { AuthenticationModule } from '../authentication/authentication.module.js';
import { Job } from './entities/jobs.entity.js';
import { JobController } from './jobs.controller.js';
import { JobService } from './jobs.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Job, User])],
  controllers: [JobController],
  providers: [JobService],
})
export class JobModule {}
