import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '../authentication/entities/user.entity.js';
import { Job } from '../jobs/entities/jobs.entity.js';
import { CreateReportDto } from './dto/create-report.dto.js';
import { Report, ReportStatus } from './entities/report.entity.js';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';
import { AdminAuditService } from '../admin/admin-audit.service.js';
import { UpdateReportStatusDto } from './dto/update-report-status.dto.js';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
    private readonly adminAuditService: AdminAuditService,
  ) {}

  getAdminReports(pagination: PaginationQueryDto) {
    return this.reportRepository.find({
      order: { createdAt: 'DESC' },
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
    });
  }

  async updateAdminReportStatus(
    reportId: number,
    dto: UpdateReportStatusDto,
    actorId: number,
  ) {
    return this.reportRepository.manager.transaction(async (manager) => {
      const reports = manager.getRepository(Report);
      const report = await reports.findOne({ where: { reportId } });
      if (!report) {
        throw new NotFoundException('Report not found.');
      }
      if (report.status !== ReportStatus.PENDING) {
        throw new ConflictException('Only pending reports can be reviewed.');
      }

      const from = report.status;
      report.status = dto.status;
      report.resolution = dto.resolution?.trim() || null;
      report.resolvedAt = new Date();
      await reports.save(report);
      await this.adminAuditService.write(manager, {
        actorId,
        action: 'report.status.update',
        targetType: 'report',
        targetId: String(reportId),
        details: {
          from,
          to: dto.status,
          resolutionProvided: Boolean(dto.resolution?.trim()),
        },
      });
      return report;
    });
  }

  async create(reporterId: number, dto: CreateReportDto) {
    const targetId = dto.targetId.trim();
    if (dto.targetType === 'user') {
      const targetUserId = Number(targetId);
      if (!Number.isSafeInteger(targetUserId) || targetUserId <= 0) {
        throw new BadRequestException(
          'A user report requires a numeric user ID.',
        );
      }
      if (targetUserId === reporterId) {
        throw new BadRequestException('You cannot report your own account.');
      }
      if (!(await this.userRepository.existsBy({ id: targetUserId }))) {
        throw new NotFoundException('The reported user was not found.');
      }
    } else if (!(await this.jobRepository.existsBy({ id: targetId }))) {
      throw new NotFoundException('The reported job was not found.');
    }

    return this.reportRepository.save(
      this.reportRepository.create({
        reporterId,
        targetType: dto.targetType,
        targetId,
        reason: dto.reason.trim(),
        details: dto.details.trim(),
        status: ReportStatus.PENDING,
        resolution: null,
        resolvedAt: null,
      }),
    );
  }
}
