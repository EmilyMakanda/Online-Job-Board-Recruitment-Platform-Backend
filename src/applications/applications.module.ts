import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApplicationsService } from './applications.service.js';
import { ApplicationsController } from './applications.controller.js';
import { Application } from './entities/application.entity.js';
import { JobModule } from '../jobs/jobs.module.js';
import { User } from '../authentication/entities/user.entity.js';
import { NotificationsModule} from '../notification/notification.module.js';
import { AdminAuditModule } from '../admin/admin-audit.module.js';
import { ApplicationsAdminController } from './applications-admin.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Application, User]), JobModule, NotificationsModule, AdminAuditModule],
  controllers: [ApplicationsController, ApplicationsAdminController],
  providers: [ApplicationsService],
  exports: [ApplicationsService],
})
export class ApplicationsModule {}
