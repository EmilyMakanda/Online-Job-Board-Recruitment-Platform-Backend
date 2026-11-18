
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

import {
  existsSync,
  mkdirSync,
  unlinkSync,
} from 'node:fs';

import { basename, join } from 'node:path';
import type { Express } from 'express';

import {
  Application,
  ApplicationStatus,
} from './entities/application.entity.js';

import {
  ApplicationDocument,
  ApplicationDocumentType,
} from './entities/application-document.entity.js';

import { CreateApplicationDto } from './dto/create-application.dto.js';
import type { UpdateApplicationDto } from './dto/update-application.dto.js';

import { JobService } from '../jobs/jobs.service.js';
import { JobStatus } from '../jobs/entities/jobs.entity.js';
import { User } from '../authentication/entities/user.entity.js';
import { NotificationsService } from '../notification/notification.service.js';

const UPLOAD_DIR = join(process.cwd(), 'uploads', 'applications');

@Injectable()
export class ApplicationsService {
  update(id: number, sub: number, updateApplicationDto: UpdateApplicationDto) {
    throw new Error('Method not implemented.');
  }
  remove(id: number, sub: number) {
    throw new Error('Method not implemented.');
  }
  private readonly logger = new Logger(ApplicationsService.name);

  constructor(
    @InjectRepository(Application)
    private readonly applicationRepository: Repository<Application>,

    @InjectRepository(ApplicationDocument)
    private readonly documentRepository: Repository<ApplicationDocument>,

    private readonly jobService: JobService,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly notificationsService: NotificationsService,
  ) {
    mkdirSync(UPLOAD_DIR, { recursive: true });
  }

  // Submit a new application with CV and supporting documents
  async create(
    dto: CreateApplicationDto,
    jobSeekerId: number,
    cv: Express.Multer.File,
    supportingFiles: Express.Multer.File[] = [],
  ): Promise<Application> {
    if (!cv) {
      throw new BadRequestException('CV is required for application.');
    }

    const job = await this.jobService.getOneJob(dto.jobId);

    if (job.status !== JobStatus.OPEN) {
      throw new BadRequestException(
        'This job is not accepting applications.',
      );
    }

    // Prevent duplicate applications
    const existingApplication = await this.applicationRepository.findOne({
      where: {
        job: { id: job.id },
        jobSeekerId,
      },
    });

    if (existingApplication) {
      throw new ConflictException(
        'You have already applied for this job.',
      );
    }

    const application = this.applicationRepository.create({
      job,
      jobSeekerId,
      coverLetter: dto.coverLetter?.trim() || '',
      status: ApplicationStatus.SUBMITTED,
    });

    const saved = await this.applicationRepository.save(application);

    try {
      const cvRecord = this.saveDocument(
        cv,
        saved,
        ApplicationDocumentType.CV,
      );

      const supportRecords = supportingFiles.map((file) =>
        this.saveDocument(
          file,
          saved,
          ApplicationDocumentType.SUPPORTING,
        ),
      );

      await this.documentRepository.save([
        cvRecord,
        ...supportRecords,
      ]);
    } catch (error) {
      await this.applicationRepository.remove(saved);

      // Remove uploaded files if saving their records fails
      for (const file of [cv, ...supportingFiles]) {
        if (file.path && existsSync(file.path)) {
          unlinkSync(file.path);
        }
      }

      throw error;
    }

    await this.notifyUser(
      jobSeekerId,
      `Your application for "${job.title}" was submitted successfully.`,
    );

    return this.findOne(saved.applicationId, jobSeekerId);
  }

  // Save uploaded document information in Oracle
  private saveDocument(
    file: Express.Multer.File,
    application: Application,
    documentType: ApplicationDocumentType,
  ): ApplicationDocument {
    if (!file.path) {
      throw new BadRequestException(
        'Uploaded file does not have a storage path.',
      );
    }

    return this.documentRepository.create({
      applicationId: application.applicationId,
      application,
      documentType,
      originalName: basename(file.originalname).slice(0, 255),
      storedName: basename(file.path),
      mimeType: file.mimetype,
      fileSize: file.size,
      filePath: file.path,
    });
  }

  // Get one application belonging to a job seeker
  async findOne(
    applicationId: number,
    jobSeekerId: number,
  ): Promise<Application> {
    const application = await this.applicationRepository.findOne({
      where: { applicationId, jobSeekerId },
      relations: {
        job: true,
        documents: true,
      },
    });

    if (!application) {
      throw new NotFoundException('Application not found.');
    }

    return application;
  }

  // Get all applications submitted by a job seeker
  findByJobSeeker(jobSeekerId: number): Promise<Application[]> {
    return this.applicationRepository.find({
      where: { jobSeekerId },
      relations: {
        job: true,
        documents: true,
      },
      order: { appliedAt: 'DESC' },
    });
  }

  // Get applications submitted for an employer's jobs
  async findByEmployer(employerId: number): Promise<Application[]> {
    return this.applicationRepository.find({
      where: {
        job: {
          postedBy: { id: employerId },
        },
      },
      relations: {
        job: true,
        documents: true,
      },
      order: { appliedAt: 'DESC' },
    });
  }

  // Allow an employer to update an application's status
  async updateStatus(
    applicationId: number,
    employerId: number,
    dto: UpdateApplicationDto,
  ): Promise<Application> {
    const application = await this.applicationRepository.findOne({
      where: { applicationId },
      relations: {
        job: {
          postedBy: true,
        },
      },
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

    application.status = dto.status;

    const saved = await this.applicationRepository.save(application);

    await this.notifyUser(
      application.jobSeekerId,
      `The status of your application for "${application.job.title}" is now ${application.status}.`,
    );

    return saved;
  }

  // Allow a job seeker to withdraw an application before review
  async withdraw(
    applicationId: number,
    jobSeekerId: number,
  ): Promise<void> {
    const application = await this.findOne(
      applicationId,
      jobSeekerId,
    );

    if (application.status !== ApplicationStatus.SUBMITTED) {
      throw new BadRequestException(
        'An application can only be withdrawn before review.',
      );
    }

    const documents = await this.documentRepository.find({
      where: { applicationId },
    });

    await this.documentRepository.remove(documents);
    await this.applicationRepository.remove(application);

    for (const document of documents) {
      if (existsSync(document.filePath)) {
        unlinkSync(document.filePath);
      }
    }
  }

  // Allow applicants and the relevant employer to access documents
  async getDocumentForUser(
    documentId: number,
    userId: number,
    role: string,
  ): Promise<ApplicationDocument> {
    const document = await this.documentRepository.findOne({
      where: { documentId },
      relations: {
        application: {
          job: {
            postedBy: true,
          },
        },
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found.');
    }

    const isApplicant =
      document.application.jobSeekerId === userId;

    const isEmployer =
      role === 'employer' &&
      document.application.job.postedBy?.id === userId;

    if (!isApplicant && !isEmployer) {
      throw new ForbiddenException(
        'You do not have access to this document.',
      );
    }

    return document;
  }

  // Send notifications to users
  private async notifyUser(
    userId: number,
    message: string,
  ): Promise<void> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (user) {
        await this.notificationsService.create({
          userId,
          message,
          email: user.email,
        });
      }
    } catch (error) {
      this.logger.error(
        `Could not create application notification for user ${userId}.`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
