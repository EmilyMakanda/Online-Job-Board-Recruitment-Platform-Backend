import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, LessThanOrEqual, MoreThan, Repository } from 'typeorm';
import { CreateJobDto } from './dto/create-job.dto.js';
import { UpdateJobDto } from './dto/update-job.dto.js';
import { Job, JobStatus } from './entities/jobs.entity.js';
import { User } from '../authentication/entities/user.entity.js';
import { Company } from '../company/entities/company.entity.js';

function deadlineHasPassed(deadline: Date | null, now = new Date()): boolean {
  return deadline === null || deadline <= now;
}

function validateDeadline(deadline: Date): Date {
  if (
    !(deadline instanceof Date) ||
    Number.isNaN(deadline.getTime()) ||
    deadlineHasPassed(deadline)
  ) {
    throw new BadRequestException('The job deadline must be in the future.');
  }

  return deadline;
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
      deadline: validateDeadline(dto.deadline),
      status: JobStatus.DRAFT,
      postedBy: user,
      company,
    });
    return this.jobRepository.save(job);
  }

  // Updates the supplied fields for a listing.
  async updateJob(jobId: string, dto: UpdateJobDto, employerId: number) {
    const job = await this.getOneJobForEmployer(jobId, employerId);

    const { deadline, ...updates } = dto;
    const deadlineUpdate =
      deadline === undefined ? {} : { deadline: validateDeadline(deadline) };
    Object.assign(job, updates, deadlineUpdate);
    return this.jobRepository.save(job);
  }

  async publishJob(jobId: string, employerId: number) {
    const job = await this.getOneJobForEmployer(jobId, employerId);
    if (job.status === JobStatus.CLOSED) {
      throw new BadRequestException('A closed job cannot be published again.');
    }
    if (deadlineHasPassed(job.deadline)) {
      await this.saveClosedJob(job);
      throw new BadRequestException(
        'A job cannot be published after its application deadline.',
      );
    }

    job.status = JobStatus.OPEN;
    return this.jobRepository.save(job);
  }

  async closeJob(jobId: string, employerId: number) {
    const job = await this.getOneJobForEmployer(jobId, employerId);
    return this.saveClosedJob(job);
  }

  // Returns all listings, newest first, for jobseekers.
  getAllJobs() {
    return this.jobRepository.find({
      where: { status: JobStatus.OPEN, deadline: MoreThan(new Date()) },
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
      .where('job.status = :status', { status: JobStatus.OPEN })
      .andWhere('job.deadline > :now', { now: new Date() })
      .andWhere(
        '(LOWER(job.title) LIKE LOWER(:term) OR LOWER(job.description) LIKE LOWER(:term) OR LOWER(job.location) LIKE LOWER(:term))',
        { term: `%${normalizedName}%` },
      )
      .orderBy('job.createdAt', 'DESC')
      .getMany();
  }

  // Job seekers and the application flow can only retrieve available listings.
  async getOneJob(id: string) {
    const job = await this.jobRepository.findOne({
      where: { id, status: JobStatus.OPEN, deadline: MoreThan(new Date()) },
      relations: { company: true },
    });

    if (!job) {
      throw new NotFoundException(`Job listing with ID "${id}" not found`);
    }

    return job;
  }

  @Cron(CronExpression.EVERY_MINUTE)
  closeExpiredJobs() {
    const now = new Date();
    const expiredOpenJobs = [
      { status: JobStatus.OPEN, deadline: LessThanOrEqual(now) },
      { status: JobStatus.OPEN, deadline: IsNull() },
    ];

    return this.jobRepository.update(expiredOpenJobs, {
      status: JobStatus.CLOSED,
    });
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

  private saveClosedJob(job: Job) {
    job.status = JobStatus.CLOSED;
    return this.jobRepository.save(job);
  }

  // Deletes a listing by ID.
  async deleteJob(id: string, employerId: number) {
    const job = await this.getOneJobForEmployer(id, employerId);

    if (job.status === JobStatus.OPEN && deadlineHasPassed(job.deadline)) {
      await this.saveClosedJob(job);
    }

    if (job.status === JobStatus.CLOSED) {
      throw new BadRequestException('A closed job cannot be deleted.');
    }

    await this.jobRepository.remove(job);
    return { message: `Job "${job.title}" successfully deleted` };
  }
}
