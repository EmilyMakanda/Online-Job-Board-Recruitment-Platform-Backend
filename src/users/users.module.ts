
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '../authentication/entities/user.entity.js';
import { Application } from '../applications/entities/application.entity.js';
import { ApplicationDocument } from '../applications/entities/application-document.entity.js';
import { Company } from '../company/entities/company.entity.js';
import { Job } from '../jobs/entities/jobs.entity.js';
import { UsersService } from './users.service.js';
import { UsersController } from './users.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Application,
      ApplicationDocument,
      Company,
      Job,
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
