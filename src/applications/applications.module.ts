import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApplicationsService } from './applications.service.js';
import { ApplicationsController } from './applications.controller.js';
import { Application } from './entities/application.entity.js';
import { ApplicationDocument } from './entities/application-document.entity.js';
import { JobApplicationRequirement } from './entities/job-application-requirements.entity.js';
import { JobModule } from '../jobs/jobs.module.js';
import { User } from '../authentication/entities/user.entity.js';
import { NotificationsModule} from '../notification/notification.module.js';
import { UsersModule } from '../users/users.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([Application, ApplicationDocument, JobApplicationRequirement, User]), JobModule, NotificationsModule,UsersModule,],
  controllers: [ApplicationsController],
  providers: [ApplicationsService],
  exports: [ApplicationsService],
})
export class ApplicationsModule {}
