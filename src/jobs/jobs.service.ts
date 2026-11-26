
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, LessThanOrEqual, MoreThan, Repository } from 'typeorm';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';
import { paginated, paginationOptions } from '../common/pagination.js';
import {
  CreateJobDto,
  JOB_APPLICATION_FIELD_KEYS,
} from './dto/create-job.dto.js';
import { UpdateJobDto } from './dto/update-job.dto.js';
import { Job, JobStatus } from './entities/jobs.entity.js';
import { User } from '../authentication/entities/user.entity.js';
import {
  Company,
  VerificationStatus,
} from '../company/entities/company.entity.js';

function deadlineHasPassed(deadline: Date | null, now = new Date()): boolean {
  return deadline === null || deadline <= now;
}

function validateDeadline(deadline: Date | string): Date {
  const parsedDeadline =
    deadline instanceof Date ? deadline : new Date(deadline);

  if (
    Number.isNaN(parsedDeadline.getTime()) ||
    deadlineHasPassed(parsedDeadline)
  ) {
    throw new BadRequestException('The job deadline must be in the future.');
  }

  return parsedDeadline;
}

function requiredTrimmedText(value: string, field: string): string {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    throw new BadRequestException(`${field} cannot be empty.`);
  }

  return trimmedValue;
}

@Injectable()
export class JobService {
  constructor(
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
  ) {}

  // Creates an immediately available job for a verified employer.
  async createJob(dto: CreateJobDto, userId: number) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

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

    if (company.verificationStatus !== VerificationStatus.VERIFIED) {
      throw new ForbiddenException(
        'The company must be verified before it can post jobs.',
      );
    }

    const applicationRequirements = dto.applicationRequirements ?? [
      {
        fieldKey: 'cv',
        fieldLabel: 'CV / Resume',
        isEnabled: true,
        isRequired: true,
      },
    ];

    for (const requirement of applicationRequirements) {
      if (
        !JOB_APPLICATION_FIELD_KEYS.includes(requirement.fieldKey) ||
        (requirement.isRequired && !requirement.isEnabled)
      ) {
        throw new BadRequestException(
          'Application requirements must use supported fields and cannot require a disabled field.',
        );
      }
    }

    const job = this.jobRepository.create({
      ...dto,
      title: requiredTrimmedText(dto.title, 'Title'),
      description: requiredTrimmedText(dto.description, 'Description'),
      location: requiredTrimmedText(dto.location, 'Location'),
      deadline: validateDeadline(dto.deadline),
      status: JobStatus.APPROVED,
      postedBy: user,
      company,
      applicationRequirements: applicationRequirements.map((requirement) => ({
        fieldKey: requirement.fieldKey,
        fieldLabel: requiredTrimmedText(requirement.fieldLabel, 'Field label'),
        isRequired: Number(requirement.isRequired),
        isEnabled: Number(requirement.isEnabled),
      })),
    });

    return this.jobRepository.save(job);
  }

  // Updates the supplied fields without requiring re-approval.
  async updateJob(jobId: string, dto: UpdateJobDto, employerId: number) {
    const job = await this.getOneJobForEmployer(jobId, employerId);

    if (job.status === JobStatus.CLOSED || job.status === JobStatus.REMOVED) {
      throw new BadRequestException(
        'A closed or removed job cannot be edited.',
      );
    }

    if (
      dto.title === undefined &&
      dto.description === undefined &&
      dto.location === undefined &&
      dto.deadline === undefined
    ) {
      throw new BadRequestException('At least one job field must be updated.');
    }

    if (dto.title !== undefined) {
      job.title = requiredTrimmedText(dto.title, 'Title');
    }

    if (dto.description !== undefined) {
      job.description = requiredTrimmedText(dto.description, 'Description');
    }

    if (dto.location !== undefined) {
      job.location = requiredTrimmedText(dto.location, 'Location');
    }

    if (dto.deadline !== undefined) {
      job.deadline = validateDeadline(dto.deadline);
    }

    return this.jobRepository.save(job);
  }

  // Publishes an existing eligible job immediately.
  async publishJob(jobId: string, employerId: number) {
    const job = await this.getOneJobForEmployer(jobId, employerId);

    if (job.status === JobStatus.CLOSED) {
      throw new BadRequestException('A closed job cannot be published again.');
    }

    if (job.status === JobStatus.REMOVED) {
      throw new BadRequestException(
        'An administratively removed job cannot be published.',
      );
    }

    if (
      job.status !== JobStatus.DRAFT &&
      job.status !== JobStatus.REJECTED &&
      job.status !== JobStatus.PENDING
    ) {
      throw new BadRequestException(
        'Only draft, rejected, or pending jobs can be published.',
      );
    }

    if (job.company.verificationStatus !== VerificationStatus.VERIFIED) {
      throw new ForbiddenException(
        'The company must be verified before publishing jobs.',
      );
    }

    if (deadlineHasPassed(job.deadline)) {
      await this.saveClosedJob(job);

      throw new BadRequestException(
        'A job cannot be published after its application deadline.',
      );
    }

    job.status = JobStatus.APPROVED;

    return this.jobRepository.save(job);
  }

  // Allows an employer to close their own active listing.
  async closeJob(jobId: string, employerId: number) {
    const job = await this.getOneJobForEmployer(jobId, employerId);

    if (job.status !== JobStatus.APPROVED) {
      throw new BadRequestException('Only approved jobs can be closed.');
    }

    return this.saveClosedJob(job);
  }

  // Returns available jobs from verified companies.
  async getAllJobs(pagination: PaginationQueryDto) {
    const result = await this.jobRepository.findAndCount({
      where: {
        status: JobStatus.APPROVED,
        deadline: MoreThan(new Date()),
        company: { verificationStatus: VerificationStatus.VERIFIED },
      },
      relations: { company: true, applicationRequirements: true },
      order: { createdAt: 'DESC' },
      ...paginationOptions(pagination),
    });
    return paginated(result, pagination);
  }

  async getJobsByEmployer(
    employerId: number,
    pagination: PaginationQueryDto,
  ) {
    const result = await this.jobRepository.findAndCount({
      where: { company: { employerId } },
      relations: { company: true, applicationRequirements: true },
      order: { createdAt: 'DESC' },
      ...paginationOptions(pagination),
    });
    return paginated(result, pagination);
  }

  async searchJobsByName(
    name: string,
    location?: string,
    pagination = new PaginationQueryDto(),
  ) {
    const normalizedName = name?.trim();
    const normalizedLocation = location?.trim();

    if (!normalizedName && !normalizedLocation) {
      throw new BadRequestException('A search term or location is required.');
    }

    if (
      (normalizedName && normalizedName.length > 100) ||
      (normalizedLocation && normalizedLocation.length > 100)
    ) {
      throw new BadRequestException('Search filters are too long.');
    }

    const query = this.jobRepository
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.company', 'company')
      .leftJoinAndSelect(
        'job.applicationRequirements',
        'applicationRequirements',
      )
      .where('job.status = :status', { status: JobStatus.APPROVED })
      .andWhere('job.deadline > :now', { now: new Date() })
      .andWhere('company.verificationStatus = :companyStatus', {
        companyStatus: VerificationStatus.VERIFIED,
      });

    if (normalizedName) {
      query.andWhere(
        '(LOWER(job.title) LIKE LOWER(:term) OR LOWER(job.description) LIKE LOWER(:term) OR LOWER(job.location) LIKE LOWER(:term))',
        { term: `%${normalizedName}%` },
      );
    }

    if (normalizedLocation) {
      query.andWhere('LOWER(job.location) LIKE LOWER(:location)', {
        location: `%${normalizedLocation}%`,
      });
    }

    const result = await query
      .orderBy('job.createdAt', 'DESC')
      .skip((pagination.page - 1) * pagination.limit)
      .take(pagination.limit)
      .getManyAndCount();
    return paginated(result, pagination);
  }

  // Job seekers can only retrieve available listings.
  async getOneJob(id: string) {
    const job = await this.jobRepository.findOne({
      where: {
        id,
        status: JobStatus.APPROVED,
        deadline: MoreThan(new Date()),
        company: { verificationStatus: VerificationStatus.VERIFIED },
      },
      relations: { company: true, applicationRequirements: true },
    });

    if (!job) {
      throw new NotFoundException(`Job listing with ID "${id}" not found`);
    }

    return job;
  }

  // Automatically closes expired approved jobs.
  @Cron(CronExpression.EVERY_MINUTE)
  closeExpiredJobs() {
    const now = new Date();

    const expiredApprovedJobs = [
      { status: JobStatus.APPROVED, deadline: LessThanOrEqual(now) },
      { status: JobStatus.APPROVED, deadline: IsNull() },
    ];

    return this.jobRepository.update(expiredApprovedJobs, {
      status: JobStatus.CLOSED,
    });
  }

  async getOneJobForEmployer(id: string, employerId: number) {
    const job = await this.jobRepository.findOne({
      where: { id, company: { employerId } },
      relations: { company: true, applicationRequirements: true },
    });

    if (!job) {
      throw new NotFoundException(`Job listing with ID "${id}" not found`);
    }

    return job;
  }

  private saveClosedJob(job: Job) {
    job.status = JobStatus.CLOSED;
    return this.jobRepository.save(job);
  }

  // Closes a listing while preserving its application history.
  async deleteJob(id: string, employerId: number) {
    const job = await this.getOneJobForEmployer(id, employerId);

    if (job.status === JobStatus.REMOVED) {
      return {
        message: 'The job has already been removed from public listings.',
        job,
      };
    }

    if (job.status !== JobStatus.CLOSED) {
      await this.saveClosedJob(job);
    }

    return {
      message: 'The job was closed and retained with its application history.',
      job,
    };
  }
}
