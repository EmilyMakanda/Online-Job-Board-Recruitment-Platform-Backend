import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../authentication/entities/user.entity.js';
import { Company } from '../company/entities/company.entity.js';
import { Job } from './entities/jobs.entity.js';
import { JobApplicationRequirement } from '../applications/entities/job-application-requirements.entity.js';
import { JobController } from './jobs.controller.js';
import { JobService } from './jobs.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Job, JobApplicationRequirement, User, Company]),
  ],
  controllers: [JobController],
  providers: [JobService],
  exports: [JobService],
})
export class JobModule {}
