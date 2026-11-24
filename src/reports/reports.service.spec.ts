import { BadRequestException } from '@nestjs/common';
import type { Repository } from 'typeorm';

import { User } from '../authentication/entities/user.entity.js';
import { Job } from '../jobs/entities/jobs.entity.js';
import { CreateReportDto } from './dto/create-report.dto.js';
import { Report, ReportStatus } from './entities/report.entity.js';
import { ReportsService } from './reports.service.js';
import { AdminAuditService } from '../admin/admin-audit.service.js';
import { UpdateReportStatusDto } from '../admin/dto/update-report-status.dto.js';

describe('ReportsService', () => {
  const reportRepository = {
    create: vi.fn((report) => report),
    save: vi.fn((report) => Promise.resolve(report)),
  };
  const userRepository = { existsBy: vi.fn() };
  const jobRepository = { existsBy: vi.fn() };
  const auditService = { write: vi.fn() };
  const transactionManager = {
    getRepository: vi.fn(() => reportRepository),
  };
  reportRepository.findOne = vi.fn();
  reportRepository.manager = {
    transaction: vi.fn((callback) => callback(transactionManager)),
  };
  let service: ReportsService;

  beforeEach(() => {
    vi.clearAllMocks();
    reportRepository.findOne.mockResolvedValue(null);
    auditService.write.mockResolvedValue({});
    service = new ReportsService(
      reportRepository as unknown as Repository<Report>,
      userRepository as unknown as Repository<User>,
      jobRepository as unknown as Repository<Job>,
      auditService as unknown as AdminAuditService,
    );
  });

  it('creates a pending report for an existing job', async () => {
    jobRepository.existsBy.mockResolvedValue(true);

    await expect(
      service.create(7, {
        targetType: 'job',
        targetId: 'job-uuid',
        reason: 'Misleading listing',
        details: 'The salary information is not accurate.',
      }),
    ).resolves.toMatchObject({
      reporterId: 7,
      targetType: 'job',
      targetId: 'job-uuid',
      status: ReportStatus.PENDING,
    });
    expect(reportRepository.save).toHaveBeenCalled();
  });

  it('does not allow users to report themselves', async () => {
    await expect(
      service.create(7, {
        targetType: 'user',
        targetId: '7',
        reason: 'Self report',
        details: 'Invalid report.',
      } as CreateReportDto),
    ).rejects.toThrow(BadRequestException);
    expect(reportRepository.save).not.toHaveBeenCalled();
  });

  it('resolves pending reports with an audit record in the same transaction', async () => {
    reportRepository.findOne.mockResolvedValue({
      reportId: 5,
      status: ReportStatus.PENDING,
      resolution: null,
    });

    await expect(
      service.updateAdminReportStatus(
        5,
        {
          status: ReportStatus.RESOLVED,
          resolution: 'Reviewed',
        } as UpdateReportStatusDto,
        11,
      ),
    ).resolves.toMatchObject({
      status: ReportStatus.RESOLVED,
      resolution: 'Reviewed',
    });
    expect(auditService.write).toHaveBeenCalledWith(
      transactionManager,
      expect.objectContaining({
        actorId: 11,
        action: 'report.status.update',
        targetId: '5',
      }),
    );
  });
});
