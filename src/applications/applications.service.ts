import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Application, ApplicationStatus } from './entities/application.entity.js';
import { CreateApplicationDto } from './dto/create-application.dto.js';
import type { UpdateApplicationDto } from './dto/update-application.dto.js';
//import { UpdateApplicationStatusDto } from './dto/update-application2.dto.js';
import { JobService } from '../jobs/jobs.service.js';
import { JobStatus } from '../jobs/entities/jobs.entity.js';
import { User } from '../authentication/entities/user.entity.js';
import { NotificationsService } from '../notification/notification.service.js';

@Injectable()
export class ApplicationsService {
  private readonly logger = new Logger(ApplicationsService.name);

  constructor(
    @InjectRepository(Application)
    private readonly applicationRepository: Repository<Application>,
    private readonly jobService: JobService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findByEmployer(employerId: number): Promise<Application[]> {
    return this.applicationRepository.find({
      where: { job: { postedBy: { id: employerId } } },
      relations: { job: true },
      order: { appliedAt: 'DESC' },
    });
  }

  async create(
    createApplicationDto: CreateApplicationDto,
    jobSeekerId: number,
  ): Promise<Application> {
    const job = await this.jobService.getOneJob(createApplicationDto.jobId);

    if (job.status !== JobStatus.OPEN) {
      throw new BadRequestException('This job is not accepting applications.');
    }

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
      coverLetter: createApplicationDto.coverLetter?.trim() || '',
      status: ApplicationStatus.SUBMITTED,
    });

    const savedApplication = await this.applicationRepository.save(application);

    await this.notifyUser(
      jobSeekerId,
      `Your application for "${job.title}" was submitted successfully.`,
    );

    return savedApplication;
  }

  async findOne(applicationId: number, jobSeekerId: number): Promise<Application> {
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

    if (application.status !== ApplicationStatus.SUBMITTED) {
      throw new BadRequestException(
        'A cover letter can only be edited before the application is received.',
      );
    }

    const coverLetterValue = (
      updateApplicationDto as Partial<{ coverLetter?: string | null }>
    ).coverLetter;

    if (coverLetterValue !== undefined) {
      const trimmedCoverLetter =
        typeof coverLetterValue === 'string' ? coverLetterValue.trim() : '';

      application.coverLetter = trimmedCoverLetter || '';
    }

    Object.assign(application, updateApplicationDto);
    return this.applicationRepository.save(application);
  }

  async updateStatus(
    applicationId: number,
    employerId: number,
    updateDto: UpdateApplicationDto,
  ): Promise<Application> {
    const application = await this.applicationRepository.findOne({
      where: { applicationId },
      relations: { job: { postedBy: true } },
    });

    if (!application) {
      throw new NotFoundException('Application not found.');
    }

    if (application.job.postedBy?.id !== employerId) {
      throw new ForbiddenException(
        'You can only update applications for jobs you posted.',
      );
    }

    if (
      application.status === ApplicationStatus.ACCEPTED ||
      application.status === ApplicationStatus.REJECTED
    ) {
      throw new BadRequestException(
        'This application has already received a final decision.',
      );
    }

    application.status = updateDto.status;

    const savedApplication = await this.applicationRepository.save(application);

    await this.notifyUser(
      application.jobSeekerId,
      `The status of your application for "${application.job.title}" is now ${application.status}.`,
    );

    return savedApplication;
  }

  async remove(applicationId: number, jobSeekerId: number): Promise<void> {
    const application = await this.findOne(applicationId, jobSeekerId);

    if (application.status !== ApplicationStatus.SUBMITTED) {
      throw new BadRequestException(
        'An application can only be withdrawn before it is reviewed.',
      );
    }

    await this.applicationRepository.remove(application);
  }

  private async notifyUser(userId: number, message: string): Promise<void> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        return;
      }

      await this.notificationsService.create({
        userId,
        message,
        email: user.email,
      });
    } catch (error) {
      this.logger.error(
        `Could not create application notification for user ${userId}.`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
