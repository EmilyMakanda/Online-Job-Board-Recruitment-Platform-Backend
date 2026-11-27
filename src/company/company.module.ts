
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Company } from './entities/company.entity.js';
import { User } from '../authentication/entities/user.entity.js';
import { ApplicationDocument } from '../applications/entities/application-document.entity.js';
import { Job } from '../jobs/entities/jobs.entity.js';
import { CompanyController } from './company.controller.js';
import { CompanyService } from './company.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Company, User, ApplicationDocument, Job]),
  ],
  controllers: [CompanyController],
  providers: [CompanyService],
  exports: [CompanyService],
})
export class CompanyModule {}
