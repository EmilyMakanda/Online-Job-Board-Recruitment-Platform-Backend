import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateJobDto } from './dto/create-job.dto.js';
import { UpdateJobDto } from './dto/update-job.dto.js';
import { Job } from './entities/jobs.entity.js';
import { User, UserRole } from '../users/entities/user.entity.js';

type JobAdmin = {
  userId: string;
  role: string;
};

@Injectable()
export class JobService {
  constructor(
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // Creates a job listing and associates it with its owner.
  async createJob(dto: CreateJobDto, userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }

    const job = this.jobRepository.create({ ...dto, postedBy: user });
    return this.jobRepository.save(job);
  }

  // Updates a listing if the requester owns it or is an admin.
  async updateJob(jobId: string, dto: UpdateJobDto, user: JobAdmin) {
    const job = await this.getOneJob(jobId);
    this.ensureCanManageJob(job, user, 'update');

    Object.assign(job, dto);
    return this.jobRepository.save(job);
  }

  // Returns all listings, newest first, with their owners.
  getAllJobs() {
    return this.jobRepository.find({
      relations: {'postedBy': true},
      order: { createdAt: 'DESC' },
    });
  }

  // Finds a listing and loads the related owner and applications.
  async getOneJob(id: string) {
    const job = await this.jobRepository.findOne({
      where: { id },
      relations: {postedBy: true, 'applications': true},
    });

    if (!job) {
      throw new NotFoundException(`Job listing with ID "${id}" not found`);
    }

    return job;
  }

  // Deletes a listing if the requester owns it or is an admin.
  async deleteJob(id: string, user: JobAdmin) {
    const job = await this.getOneJob(id);
    this.ensureCanManageJob(job, user, 'delete');

    await this.jobRepository.remove(job);
    return { message: `Job "${job.title}" successfully deleted` };
  }

  //Allows only the listing owner or an admin to manage a listing.
  private ensureCanManageJob(
    job: Job,
    user: JobAdmin,
    action: 'update' | 'delete',
  ): void {
    const isOwner = job.postedBy.id === user.userId;
    const isAdmin = user.role === UserRole.ADMIN;

    if (!isOwner && !isAdmin) {
      const actionLabel = action === 'update' ? 'update' : 'delete';
      throw new ForbiddenException(
        `You do not have permission to ${actionLabel} this job listing`,
      );
    }
  }
}