import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import type { Repository } from 'typeorm';

import { User } from '../authentication/entities/user.entity.js';
import { Job } from '../jobs/entities/jobs.entity.js';
import { CreateReportDto } from './dto/create-report.dto.js';
import { Report, ReportStatus } from './entities/report.entity.js';
import { ReportsService } from './reports.service.js';
import { ResolveReportDto } from './dto/resolve-report.dto.js';

describe('ReportsService', () => {
  const reportRepository = {
    create: vi.fn((report) => report),
    save: vi.fn((report) => Promise.resolve(report)),
    findAndCount: vi.fn(),
    findOneBy: vi.fn(),
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

  it('lists reports in a bounded page with an optional status filter', async () => {
    const reports = [{ reportId: 1, status: ReportStatus.PENDING }] as Report[];
    reportRepository.findAndCount.mockResolvedValue([reports, 1]);

    await expect(
      service.findAll(
        { page: 1, limit: 25 } as never,
        ReportStatus.PENDING,
      ),
    ).resolves.toMatchObject({
      items: reports,
      total: 1,
      page: 1,
      limit: 25,
    });
    expect(reportRepository.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: ReportStatus.PENDING },
        skip: 0,
        take: 25,
      }),
    );
  });

  it('resolves a pending report and records its resolution time', async () => {
    const report = {
      reportId: 4,
      status: ReportStatus.PENDING,
      resolution: null,
      resolvedAt: null,
    } as Report;
    reportRepository.findOneBy.mockResolvedValue(report);

    await service.resolve(4, {
      status: ReportStatus.RESOLVED,
      resolution: 'Reviewed and actioned.',
    } as ResolveReportDto);

    expect(report.status).toBe(ReportStatus.RESOLVED);
    expect(report.resolution).toBe('Reviewed and actioned.');
    expect(report.resolvedAt).toBeInstanceOf(Date);
    expect(reportRepository.save).toHaveBeenCalledWith(report);
  });

  it('rejects repeated report resolution', async () => {
    reportRepository.findOneBy.mockResolvedValue({
      reportId: 4,
      status: ReportStatus.DISMISSED,
    });

    await expect(
      service.resolve(4, {
        status: ReportStatus.RESOLVED,
        resolution: 'Actioned',
      } as ResolveReportDto),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('returns not found when resolving an unknown report', async () => {
    reportRepository.findOneBy.mockResolvedValue(null);

    await expect(
      service.resolve(99, {
        status: ReportStatus.RESOLVED,
        resolution: 'Actioned',
      } as ResolveReportDto),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
