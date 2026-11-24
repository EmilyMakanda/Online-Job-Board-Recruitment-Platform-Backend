
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '../authentication/entities/user.entity.js';
import { UsersService } from './users.service.js';
import { UsersController } from './users.controller.js';
import { Company } from '../company/entities/company.entity.js';
import { AdminAuditModule } from '../admin/admin-audit.module.js';
import { UsersAdminController } from './users-admin.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([User, Company]), AdminAuditModule],
  controllers: [UsersController, UsersAdminController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
