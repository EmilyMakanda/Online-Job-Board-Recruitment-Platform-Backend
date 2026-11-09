import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Application } from './entities/application.entity.js';
import { CreateApplicationDto } from './dto/create-application.dto.js';
import type { UpdateApplicationDto } from './dto/update-application.dto.js';
import { JobService } from '../jobs/jobs.service.js';

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectRepository(Application)
    private readonly applicationRepository: Repository<Application>,
    private readonly jobService: JobService,
  ) {}

  async create(
    createApplicationDto: CreateApplicationDto,
    jobSeekerId: number,
  ): Promise<Application> {
    const job = await this.jobService.getOneJob(createApplicationDto.jobId);
    const existingApplication = await this.applicationRepository.findOne({
      where: {
        job: { id: job.id },
        jobSeekerId,
      },
    });

    if (existingApplication) {
      throw new ConflictException('You have already applied for this job.');
    }

    const application = this.applicationRepository.create({
      job,
      jobSeekerId,
      coverLetter: createApplicationDto.coverLetter,
    });

    return this.applicationRepository.save(application);
  }

  async findOne(
    applicationId: number,
    jobSeekerId: number,
  ): Promise<Application> {
    const application = await this.applicationRepository.findOne({
      where: { applicationId, jobSeekerId },
      relations: { job: true },
    });

    if (!application) {
      throw new NotFoundException('Application not found.');
    }
    return application;
  }

  findByJobSeeker(jobSeekerId: number): Promise<Application[]> {
    return this.applicationRepository.find({
      where: { jobSeekerId },
      relations: { job: true },
      order: { appliedAt: 'DESC' },
    });
  }

  async update(
    applicationId: number,
    jobSeekerId: number,
    updateApplicationDto: UpdateApplicationDto,
  ): Promise<Application> {
    const application = await this.findOne(applicationId, jobSeekerId);
    Object.assign(application, updateApplicationDto);
    return this.applicationRepository.save(application);
  }

  async remove(applicationId: number, jobSeekerId: number): Promise<void> {
    const application = await this.findOne(applicationId, jobSeekerId);
    await this.applicationRepository.remove(application);
  }
}
