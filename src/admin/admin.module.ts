import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AdminController } from './admin.controller.js';
import { AdminService } from './admin.service.js';
import { AdminAuditModule } from './admin-audit.module.js';
import { User } from '../authentication/entities/user.entity.js';
import { Job } from '../jobs/entities/jobs.entity.js';
import { Application } from '../applications/entities/application.entity.js';
import { AdminAuditLog } from './entities/admin-audit-log.entity.js';
@Module({
  imports: [
    TypeOrmModule.forFeature([User, Job, Application, AdminAuditLog]),
    AdminAuditModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
