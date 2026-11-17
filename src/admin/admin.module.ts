import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AdminController } from './admin.controller.js';
import { AdminService } from './admin.service.js';
import { User } from '../authentication/entities/user.entity.js';
import { Company } from '../company/entities/company.entity.js';
import { Job } from '../jobs/entities/jobs.entity.js';
import { Application } from '../applications/entities/application.entity.js';
import { Report } from '../reports/entities/report.entity.js';
@Module({
  imports: [
    TypeOrmModule.forFeature([User, Company, Job, Application, Report]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
