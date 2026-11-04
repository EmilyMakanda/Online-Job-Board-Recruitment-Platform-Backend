import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateJobDto } from './dto/create-job.dto.js';
import { UpdateJobDto } from './dto/update-job.dto.js';
import { Job } from './entities/jobs.entity.js';
import { User } from '../authentication/entities/user.entity.js';

@Injectable()
export class JobService {
  constructor(
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // Creates a job listing for the authenticated employer.
  async createJob(dto: CreateJobDto, userId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User profile not found');
    }
    const job = this.jobRepository.create({ ...dto, postedBy: user });
    return this.jobRepository.save(job);
  }

  // Updates the supplied fields for a listing.
  async updateJob(jobId: string, dto: UpdateJobDto, employerId: number) {
    const job = await this.getOneJobForEmployer(jobId, employerId);

    Object.assign(job, dto);
    return this.jobRepository.save(job);
  }

  // Returns all listings, newest first, for jobseekers.
  getAllJobs() {
    return this.jobRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  getJobsByEmployer(employerId: number) {
    return this.jobRepository.find({
      where: { postedBy: { id: employerId } },
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
      .where('LOWER(job.title) LIKE LOWER(:title)', {
        title: `%${normalizedName}%`,
      })
      .orderBy('job.createdAt', 'DESC')
      .getMany();
  }

  // Finds a listing by ID.
  async getOneJob(id: string) {
    const job = await this.jobRepository.findOne({ where: { id } });

    if (!job) {
      throw new NotFoundException(`Job listing with ID "${id}" not found`);
    }

    return job;
  }

  async getOneJobForEmployer(id: string, employerId: number) {
    const job = await this.jobRepository.findOne({
      where: { id, postedBy: { id: employerId } },
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
