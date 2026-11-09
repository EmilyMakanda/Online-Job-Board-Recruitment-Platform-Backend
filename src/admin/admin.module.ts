
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AdminController } from './admin.controller.js';
import { AdminService } from './admin.service.js';
import { User } from '../authentication/entities/user.entity.js';
import { Company } from '../company/entities/company.entity.js';
@Module({
  imports: [TypeOrmModule.forFeature([User, Company])],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
