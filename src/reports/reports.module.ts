import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '../authentication/entities/user.entity.js';
import { Job } from '../jobs/entities/jobs.entity.js';
import { Report } from './entities/report.entity.js';
import { ReportsController } from './reports.controller.js';
import { ReportsService } from './reports.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Report, User, Job])],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
