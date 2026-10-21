import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateJobDto } from './dto/create-job.dto.js';
import { UpdateJobDto } from './dto/update-job.dto.js';
import { Job } from './entities/jobs.entity.js';

@Injectable()
export class JobService {
  constructor(
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
  ) {}

  // Creates a job listing with the supplied poster ID.
  async createJob(dto: CreateJobDto, postedByUserId: string) {
    const job = this.jobRepository.create({ ...dto, postedByUserId });
    return this.jobRepository.save(job);
  }

  // Updates the supplied fields for a listing.
  async updateJob(jobId: string, dto: UpdateJobDto) {
    const job = await this.getOneJob(jobId);

    Object.assign(job, dto);
    return this.jobRepository.save(job);
  }

  // Returns all listings, newest first.
  getAllJobs() {
    return this.jobRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  // Finds a listing by ID.
  async getOneJob(id: string) {
    const job = await this.jobRepository.findOne({ where: { id } });

    if (!job) {
      throw new NotFoundException(`Job listing with ID "${id}" not found`);
    }

    return job;
  }

  // Deletes a listing by ID.
  async deleteJob(id: string) {
    const job = await this.getOneJob(id);

    await this.jobRepository.remove(job);
    return { message: `Job "${job.title}" successfully deleted` };
  }
}