
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Company } from './entities/company.entity.js';
import { User } from '../authentication/entities/user.entity.js';
import { CompanyController } from './company.controller.js';
import { CompanyService } from './company.service.js';
import { Job } from '../jobs/entities/jobs.entity.js';
import { AdminAuditModule } from '../admin/admin-audit.module.js';
import { CompanyAdminController } from './company-admin.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Company, User, Job]), AdminAuditModule],
  controllers: [CompanyController, CompanyAdminController],
  providers: [CompanyService],
  exports: [CompanyService],
})
export class CompanyModule {}
