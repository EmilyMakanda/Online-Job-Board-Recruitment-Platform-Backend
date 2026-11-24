import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '../authentication/entities/user.entity.js';
import { Application } from '../applications/entities/application.entity.js';
import { Job } from '../jobs/entities/jobs.entity.js';
import { AdminAuditLog } from './entities/admin-audit-log.entity.js';
import { AdminAuditService } from './admin-audit.service.js';
import { AdminAuditController } from './admin-audit.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([AdminAuditLog, User, Job, Application]),
  ],
  controllers: [AdminAuditController],
  providers: [AdminAuditService],
  exports: [AdminAuditService],
})
export class AdminAuditModule {}
