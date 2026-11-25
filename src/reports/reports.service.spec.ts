import { BadRequestException } from '@nestjs/common';
import type { Repository } from 'typeorm';

import { User } from '../authentication/entities/user.entity.js';
import { Job } from '../jobs/entities/jobs.entity.js';
import { CreateReportDto } from './dto/create-report.dto.js';
import { Report, ReportStatus } from './entities/report.entity.js';
import { ReportsService } from './reports.service.js';

describe('ReportsService', () => {
  const reportRepository = {
    create: vi.fn((report) => report),
    save: vi.fn((report) => Promise.resolve(report)),
  };
  const userRepository = { existsBy: vi.fn() };
  const jobRepository = { existsBy: vi.fn() };
  let service: ReportsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ReportsService(
      reportRepository as unknown as Repository<Report>,
      userRepository as unknown as Repository<User>,
      jobRepository as unknown as Repository<Job>,
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
});
