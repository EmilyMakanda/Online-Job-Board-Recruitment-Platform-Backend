import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { EntityManager } from 'typeorm';
import { Repository } from 'typeorm';

import { User } from '../authentication/entities/user.entity.js';
import { Application } from '../applications/entities/application.entity.js';
import { Job, JobStatus } from '../jobs/entities/jobs.entity.js';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';
import { AdminAuditLog } from './entities/admin-audit-log.entity.js';

export interface AdminAuditEvent {
  actorId: number;
  action: string;
  targetType: string;
  targetId: string;
  details: Record<string, string | number | boolean | null>;
}

@Injectable()
export class AdminAuditService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
    @InjectRepository(Application)
    private readonly applicationRepository: Repository<Application>,
    @InjectRepository(AdminAuditLog)
    private readonly auditLogRepository: Repository<AdminAuditLog>,
  ) {}

  write(manager: EntityManager, event: AdminAuditEvent) {
    return manager.getRepository(AdminAuditLog).save({
      ...event,
      details: JSON.stringify(event.details),
    });
  }

  getAuditLogs(pagination: PaginationQueryDto) {
    return this.auditLogRepository.find({
      order: { createdAt: 'DESC', logId: 'DESC' },
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
    });
  }

  async getStatistics() {
    const [
      totalUsers,
      totalJobSeekers,
      totalEmployers,
      totalAdministrators,
      totalJobs,
      approvedJobs,
      pendingJobs,
      rejectedJobs,
      totalApplications,
    ] = await Promise.all([
      this.userRepository.count(),
      this.userRepository.count({ where: { role: 'job_seeker' } }),
      this.userRepository.count({ where: { role: 'employer' } }),
      this.userRepository.count({ where: { role: 'admin' } }),
      this.jobRepository.count(),
      this.jobRepository.count({ where: { status: JobStatus.APPROVED } }),
      this.jobRepository.count({ where: { status: JobStatus.PENDING } }),
      this.jobRepository.count({ where: { status: JobStatus.REJECTED } }),
      this.applicationRepository.count(),
    ]);

    return {
      totalUsers,
      totalJobSeekers,
      totalEmployers,
      totalAdministrators,
      totalJobs,
      approvedJobs,
      pendingJobs,
      rejectedJobs,
      totalApplications,
    };
  }
}
