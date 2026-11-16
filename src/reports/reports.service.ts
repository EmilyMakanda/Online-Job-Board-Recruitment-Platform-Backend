import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '../authentication/entities/user.entity.js';
import { Job } from '../jobs/entities/jobs.entity.js';
import { CreateReportDto } from './dto/create-report.dto.js';
import { Report, ReportStatus } from './entities/report.entity.js';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
  ) {}

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
