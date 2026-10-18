import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApplicationsService } from './applications.service.js';
import { ApplicationsController } from './applications.controller.js';
import { Application } from './entities/application.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Application]),],
  controllers: [ApplicationsController],
  providers: [ApplicationsService],
  exports: [ApplicationsService,],
})
export class ApplicationsModule {}
