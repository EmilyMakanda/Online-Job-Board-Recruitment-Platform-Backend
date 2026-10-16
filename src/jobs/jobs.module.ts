import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Job } from './entities/jobs.entity.js';
import { AuthenticationModule } from '../authentication/authentication.module.js';
import { JobController } from './jobs.controller.js';
import { JobService } from './jobs.service.js';
import { RolesGuard } from '../authentication/roles.guard.js';

@Module({
    imports: [
        TypeOrmModule.forFeature([Job]),
        AuthenticationModule,
    ],
    controllers: [JobController],
    providers: [JobService, RolesGuard],
})
export class JobModule {}
