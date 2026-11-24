import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { User } from '../authentication/entities/user.entity.js';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';
import { Application } from '../applications/entities/application.entity.js';
import { Job, JobStatus } from '../jobs/entities/jobs.entity.js';
import { AdminAuditLog } from './entities/admin-audit-log.entity.js';
import { AdminService } from './admin.service.js';

describe('AdminService', () => {
  const userRepository = { count: vi.fn() };
  const jobRepository = { count: vi.fn() };
  const applicationRepository = { count: vi.fn() };
  const auditLogRepository = { find: vi.fn() };
  let service: AdminService;

  beforeEach(async () => {
    vi.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: getRepositoryToken(User), useValue: userRepository },
        { provide: getRepositoryToken(Job), useValue: jobRepository },
        {
          provide: getRepositoryToken(Application),
          useValue: applicationRepository,
        },
        {
          provide: getRepositoryToken(AdminAuditLog),
          useValue: auditLogRepository,
        },
      ],
    }).compile();
    service = module.get(AdminService);
  });

  it('returns platform statistics', async () => {
    const counts = [10, 5, 3, 2, 8, 2, 4, 1, 13];
    userRepository.count.mockImplementation(async () => counts.shift());
    jobRepository.count.mockImplementation(async () => counts.shift());
    applicationRepository.count.mockImplementation(async () => counts.shift());

    await expect(service.getStatistics()).resolves.toEqual({
      totalUsers: 10,
      totalJobSeekers: 5,
      totalEmployers: 3,
      totalAdministrators: 2,
      totalJobs: 8,
      approvedJobs: 2,
      pendingJobs: 4,
      rejectedJobs: 1,
      totalApplications: 13,
    });
    expect(jobRepository.count).toHaveBeenNthCalledWith(2, {
      where: { status: JobStatus.APPROVED },
    });
  });

  it('returns paginated audit records, newest first', async () => {
    auditLogRepository.find.mockResolvedValue([]);
    const pagination = Object.assign(new PaginationQueryDto(), {
      page: 2,
      limit: 25,
    });

    await service.getAuditLogs(pagination);

    expect(auditLogRepository.find).toHaveBeenCalledWith({
      order: { createdAt: 'DESC', logId: 'DESC' },
      skip: 25,
      take: 25,
    });
  });
});
