import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateJobDto } from './dto/create-job.dto.js';
import { UpdateJobDto } from './dto/update-job.dto.js';
import { Job } from './entities/jobs.entity.js';
import { JobStatus } from './entities/jobs.entity.js';
import { User } from '../authentication/entities/user.entity.js';
import { Company } from '../company/entities/company.entity.js';
import { AdminAuditService } from '../admin/admin-audit.service.js';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';

@Injectable()
export class JobService {
  constructor(
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    private readonly adminAuditService: AdminAuditService,
  ) {}

  getAdminJobs(pagination: PaginationQueryDto) {
    return this.jobRepository.find({
      relations: { company: true },
      order: { createdAt: 'DESC' },
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
    });
  }

  async approveAdminJob(id: string, actorId: number) {
    return this.jobRepository.manager.transaction(async (manager) => {
      const jobs = manager.getRepository(Job);
      const job = await jobs.findOne({
        where: { id },
        relations: { company: true },
      });
      if (!job) {
        throw new NotFoundException(`Job listing with ID "${id}" not found`);
      }
      if (job.status !== JobStatus.PENDING) {
        throw new ConflictException('Only pending jobs can be approved.');
      }
      if (job.company?.verificationStatus !== 'verified') {
        throw new ConflictException(
          'A job can only be approved when its company is verified.',
        );
      }

      job.status = JobStatus.APPROVED;
      await jobs.save(job);
      await this.adminAuditService.write(manager, {
        actorId,
        action: 'job.approve',
        targetType: 'job',
        targetId: id,
        details: { from: JobStatus.PENDING, to: JobStatus.APPROVED },
      });
      return job;
    });
  }

  async rejectAdminJob(id: string, actorId: number) {
    return this.jobRepository.manager.transaction(async (manager) => {
      const jobs = manager.getRepository(Job);
      const job = await jobs.findOne({
        where: { id },
        relations: { company: true },
      });
      if (!job) {
        throw new NotFoundException(`Job listing with ID "${id}" not found`);
      }
      if (job.status !== JobStatus.PENDING) {
        throw new ConflictException('Only pending jobs can be rejected.');
      }

      job.status = JobStatus.REJECTED;
      await jobs.save(job);
      await this.adminAuditService.write(manager, {
        actorId,
        action: 'job.reject',
        targetType: 'job',
        targetId: id,
        details: { from: JobStatus.PENDING, to: JobStatus.REJECTED },
      });
      return job;
    });
  }

  async removeAdminJob(id: string, actorId: number) {
    return this.jobRepository.manager.transaction(async (manager) => {
      const jobs = manager.getRepository(Job);
      const job = await jobs.findOne({
        where: { id },
        relations: { company: true },
      });
      if (!job) {
        throw new NotFoundException(`Job listing with ID "${id}" not found`);
      }
      if (job.status === JobStatus.REMOVED) {
        throw new ConflictException('The job has already been removed.');
      }

      const from = job.status;
      job.status = JobStatus.REMOVED;
      await jobs.save(job);
      await this.adminAuditService.write(manager, {
        actorId,
        action: 'job.remove',
        targetType: 'job',
        targetId: id,
        details: { from, to: JobStatus.REMOVED },
      });
      return {
        message: 'Job posting removed from public listings.',
        job,
      };
    });
  }

  // Creates a job listing for the authenticated employer.
  async createJob(dto: CreateJobDto, userId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User profile not found');
    }
    const company = await this.companyRepository.findOneBy({
      employerId: userId,
    });
    if (!company) {
      throw new ForbiddenException(
        'An employer must have an associated company before creating a job.',
      );
    }

    const job = this.jobRepository.create({
      ...dto,
      status: JobStatus.PENDING,
      postedBy: user,
      company,
    });
    return this.jobRepository.save(job);
  }

  // Updates the supplied fields for a listing.
  async updateJob(jobId: string, dto: UpdateJobDto, employerId: number) {
    const job = await this.getOneJobForEmployer(jobId, employerId);
    if (job.status === JobStatus.REMOVED) {
      throw new BadRequestException(
        'An administratively removed job cannot be edited.',
      );
    }

    Object.assign(job, dto);
    if (
      job.status === JobStatus.APPROVED ||
      job.status === JobStatus.REJECTED
    ) {
      job.status = JobStatus.PENDING;
    }
    return this.jobRepository.save(job);
  }

  async publishJob(jobId: string, employerId: number) {
    const job = await this.getOneJobForEmployer(jobId, employerId);
    if (job.status === JobStatus.CLOSED) {
      throw new BadRequestException('A closed job cannot be published again.');
    }
    if (job.status === JobStatus.REMOVED) {
      throw new BadRequestException(
        'An administratively removed job cannot be resubmitted.',
      );
    }
    if (
      job.status !== JobStatus.DRAFT &&
      job.status !== JobStatus.REJECTED &&
      job.status !== JobStatus.PENDING
    ) {
      throw new BadRequestException(
        'Only draft or rejected jobs can be submitted for review.',
      );
    }

    job.status = JobStatus.PENDING;
    return this.jobRepository.save(job);
  }

  async closeJob(jobId: string, employerId: number) {
    const job = await this.getOneJobForEmployer(jobId, employerId);
    if (job.status !== JobStatus.APPROVED) {
      throw new BadRequestException('Only approved jobs can be closed.');
    }
    job.status = JobStatus.CLOSED;
    return this.jobRepository.save(job);
  }

  // Returns only administrator-approved listings to jobseekers.
  getAllJobs() {
    return this.jobRepository.find({
      where: { status: JobStatus.APPROVED },
      relations: { company: true },
      order: { createdAt: 'DESC' },
    });
  }

  getJobsByEmployer(employerId: number) {
    return this.jobRepository.find({
      where: { company: { employerId } },
      relations: { company: true },
      order: { createdAt: 'DESC' },
    });
  }

  searchJobsByName(name: string) {
    const normalizedName = name?.trim();
    if (!normalizedName) {
      throw new BadRequestException('A job name is required for searching.');
    }

    return this.jobRepository
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.company', 'company')
      .where('job.status = :status', { status: JobStatus.APPROVED })
      .andWhere(
        '(LOWER(job.title) LIKE LOWER(:term) OR LOWER(job.description) LIKE LOWER(:term) OR LOWER(job.location) LIKE LOWER(:term))',
        { term: `%${normalizedName}%` },
      )
      .orderBy('job.createdAt', 'DESC')
      .getMany();
  }

  // Job seekers and the application flow can only retrieve approved listings.
  async getOneJob(id: string) {
    const job = await this.jobRepository.findOne({
      where: { id, status: JobStatus.APPROVED },
      relations: { company: true },
    });

    if (!job) {
      throw new NotFoundException(`Job listing with ID "${id}" not found`);
    }

    return job;
  }

  async getOneJobForEmployer(id: string, employerId: number) {
    const job = await this.jobRepository.findOne({
      where: { id, company: { employerId } },
      relations: { company: true },
    });

    if (!job) {
      throw new NotFoundException(`Job listing with ID "${id}" not found`);
    }

    return job;
  }

  // Deletes a listing by ID.
  async deleteJob(id: string, employerId: number) {
    const job = await this.getOneJobForEmployer(id, employerId);

    await this.jobRepository.remove(job);
    return { message: `Job "${job.title}" successfully deleted` };
  }
}
