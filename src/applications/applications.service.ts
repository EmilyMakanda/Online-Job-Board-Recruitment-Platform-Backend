import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { existsSync, mkdirSync, unlinkSync } from 'node:fs';
import { basename, extname, join } from 'node:path';
import type { Express } from 'express';
import { In, Repository } from 'typeorm';

import { User } from '../authentication/entities/user.entity.js';
import type { UserRole } from '../authentication/roles.decorator.js';
import { JobService } from '../jobs/jobs.service.js';
import { Job, JobStatus } from '../jobs/entities/jobs.entity.js';
import { NotificationsService } from '../notification/notification.service.js';
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
import type { UpdateApplicationStatusDto } from './dto/update-application-status.dto.js';

const UPLOAD_DIR = join(process.cwd(), 'uploads', 'applications');
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_SUPPORTING_FILES = 5;
const APPLICATION_ANSWER_KEYS = [
  'highestEducation',
  'fieldOfStudy',
  'yearsOfExperience',
  'currentEmploymentStatus',
  'expectedSalary',
  'noticePeriod',
  'availableStartDate',
  'willingToRelocate',
  'portfolioUrl',
  'linkedinUrl',
  'additionalAnswers',
  'coverLetter',
] as const;
const ALLOWED_FILE_TYPES = new Map([
  ['.pdf', 'application/pdf'],
  ['.txt', 'text/plain'],
]);

const ALLOWED_STATUS_TRANSITIONS: Record<
  ApplicationStatus,
  readonly ApplicationStatus[]
> = {
  [ApplicationStatus.SUBMITTED]: [
    ApplicationStatus.IN_REVIEW,
    ApplicationStatus.REJECTED,
  ],
  [ApplicationStatus.IN_REVIEW]: [
    ApplicationStatus.SHORTLISTED,
    ApplicationStatus.INTERVIEW,
    ApplicationStatus.OFFERED,
    ApplicationStatus.ACCEPTED,
    ApplicationStatus.REJECTED,
  ],
  [ApplicationStatus.SHORTLISTED]: [
    ApplicationStatus.INTERVIEW,
    ApplicationStatus.OFFERED,
    ApplicationStatus.ACCEPTED,
    ApplicationStatus.REJECTED,
  ],
  [ApplicationStatus.INTERVIEW]: [
    ApplicationStatus.OFFERED,
    ApplicationStatus.ACCEPTED,
    ApplicationStatus.REJECTED,
  ],
  [ApplicationStatus.OFFERED]: [
    ApplicationStatus.ACCEPTED,
    ApplicationStatus.REJECTED,
  ],
  [ApplicationStatus.ACCEPTED]: [ApplicationStatus.HIRED],
  [ApplicationStatus.HIRED]: [],
  [ApplicationStatus.REJECTED]: [],
  [ApplicationStatus.WITHDRAWN]: [],
};

export interface ApplicantSummary {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  location: string | null;
  skills: string | null;
}

@Injectable()
export class ApplicationsService {
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

  async create(
    dto: CreateApplicationDto,
    jobSeekerId: number,
    cv?: Express.Multer.File,
    supportingFiles: Express.Multer.File[] = [],
  ) {
    const uploadedFiles = [cv, ...supportingFiles].filter(
      (file): file is Express.Multer.File => file !== undefined,
    );
    let job: Job;
    let savedApplication: Application;

    try {
      if (supportingFiles.length > MAX_SUPPORTING_FILES) {
        throw new BadRequestException(
          `No more than ${MAX_SUPPORTING_FILES} supporting files are allowed.`,
        );
      }
      for (const file of uploadedFiles) {
        this.validateUploadedFile(file);
      }

      job = await this.jobService.getOneJob(dto.jobId);
      if (job.status !== JobStatus.APPROVED) {
        throw new BadRequestException(
          'This job is not accepting applications.',
        );
      }

      const requirements = job.applicationRequirements ?? [];
      const requiredFields = requirements.filter(
        (requirement) =>
          requirement.isEnabled === 1 && requirement.isRequired === 1,
      );
      for (const requirement of requiredFields) {
        const answer =
          requirement.fieldKey === 'cv'
            ? cv
            : dto[requirement.fieldKey as keyof CreateApplicationDto];
        if (
          answer === undefined ||
          answer === null ||
          (typeof answer === 'string' && !answer.trim())
        ) {
          throw new BadRequestException(
            `${requirement.fieldLabel} is required for this application.`,
          );
        }
      }

      const enabledKeys = new Set(
        requirements
          .filter((requirement) => requirement.isEnabled === 1)
          .map(({ fieldKey }) => fieldKey),
      );
      if (cv && !enabledKeys.has('cv')) {
        throw new BadRequestException(
          'This job does not accept a CV document.',
        );
      }

      const answers: Record<string, string | number | boolean> = {};
      for (const key of APPLICATION_ANSWER_KEYS) {
        const value = dto[key];
        if (
          enabledKeys.has(key) &&
          value !== undefined &&
          key !== 'coverLetter'
        ) {
          answers[key] = value;
        }
      }

      savedApplication = await this.applicationRepository.manager.transaction(
        async (manager) => {
          const applications = manager.getRepository(Application);
          const documents = manager.getRepository(ApplicationDocument);
          const existingApplication = await applications.findOne({
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

          const application = applications.create({
            job,
            jobSeekerId,
            coverLetter: enabledKeys.has('coverLetter')
              ? dto.coverLetter?.trim() || null
              : null,
            answers: JSON.stringify(answers),
            status: ApplicationStatus.SUBMITTED,
          });
          const saved = await applications.save(application);

          const records = [
            ...(cv && enabledKeys.has('cv')
              ? [
                  this.createDocumentRecord(
                    cv,
                    saved,
                    ApplicationDocumentType.CV,
                  ),
                ]
              : []),
            ...supportingFiles.map((file) =>
              this.createDocumentRecord(
                file,
                saved,
                ApplicationDocumentType.SUPPORTING,
              ),
            ),
          ];
          saved.documents = await documents.save(records);

          return saved;
        },
      );
    } catch (error) {
      this.removeUploadedFiles(uploadedFiles);
      if (this.isUniqueConstraintViolation(error)) {
        throw new ConflictException('You have already applied for this job.');
      }
      throw error;
    }

    await this.notifyUser(
      jobSeekerId,
      `Your application for "${job.title}" was submitted successfully.`,
      'Application received',
    );
    return this.presentApplication(savedApplication);
  }

  private validateUploadedFile(file: Express.Multer.File): void {
    const extension = extname(file.originalname).toLowerCase();
    if (
      ALLOWED_FILE_TYPES.get(extension) !== file.mimetype ||
      file.size > MAX_FILE_SIZE
    ) {
      throw new BadRequestException(
        'Documents must be PDF or TXT files no larger than 5 MB.',
      );
    }
    if (!file.path) {
      throw new BadRequestException(
        'Uploaded document does not have a storage path.',
      );
    }
  }

  private createDocumentRecord(
    file: Express.Multer.File,
    application: Application,
    documentType: ApplicationDocumentType,
  ): ApplicationDocument {
    const storedName = basename(file.path);
    return this.documentRepository.create({
      applicationId: application.applicationId,
      application,
      documentType,
      originalName: basename(file.originalname).slice(0, 255),
      storedName,
      mimeType: file.mimetype,
      fileSize: file.size,
      filePath: join(UPLOAD_DIR, storedName),
    });
  }

  private isUniqueConstraintViolation(error: unknown): boolean {
    if (!(error instanceof Error)) {
      return false;
    }
    return (
      ('code' in error && error.code === 'ORA-00001') ||
      error.message.includes('ORA-00001')
    );
  }

  private removeUploadedFiles(files: Express.Multer.File[]): void {
    for (const file of files) {
      if (!file.path || !existsSync(file.path)) {
        continue;
      }
      try {
        unlinkSync(file.path);
      } catch (error) {
        this.logger.error(
          `Could not remove uploaded file ${basename(file.path)}.`,
          error instanceof Error ? error.stack : undefined,
        );
      }
    }
  }

  private removeStoredFiles(documents: ApplicationDocument[]): void {
    for (const document of documents) {
      const filePath = join(UPLOAD_DIR, basename(document.storedName));
      if (!existsSync(filePath)) {
        continue;
      }
      try {
        unlinkSync(filePath);
      } catch (error) {
        this.logger.error(
          `Could not remove application document ${document.documentId}.`,
          error instanceof Error ? error.stack : undefined,
        );
      }
    }
  }

  private async findApplication(
    applicationId: number,
    jobSeekerId: number,
  ): Promise<Application> {
    const application = await this.applicationRepository.findOne({
      where: { applicationId, jobSeekerId },
      relations: { job: true, documents: true },
    });
    if (!application) {
      throw new NotFoundException('Application not found.');
    }
    return application;
  }

  private presentApplication(application: Application) {
    return {
      ...application,
      answers: application.answers ? JSON.parse(application.answers) : {},
      documents: (application.documents ?? []).map((document) => ({
        documentId: document.documentId,
        applicationId: document.applicationId,
        documentType: document.documentType,
        originalName: document.originalName,
        mimeType: document.mimeType,
        fileSize: document.fileSize,
        uploadedAt: document.uploadedAt,
        downloadUrl: `/api/v1/applications/documents/${document.documentId}/download`,
      })),
    };
  }

  async findOne(applicationId: number, jobSeekerId: number) {
    return this.presentApplication(
      await this.findApplication(applicationId, jobSeekerId),
    );
  }

  async findByJobSeeker(jobSeekerId: number) {
    const applications = await this.applicationRepository.find({
      where: { jobSeekerId },
      relations: { job: true, documents: true },
      order: { appliedAt: 'DESC' },
    });
    return applications.map((application) =>
      this.presentApplication(application),
    );
  }

  async findByEmployer(employerId: number) {
    const applications = await this.applicationRepository.find({
      where: { job: { postedBy: { id: employerId } } },
      relations: { job: true, documents: true },
      order: { appliedAt: 'DESC' },
    });
    if (applications.length === 0) {
      return [];
    }

    const applicants = await this.userRepository.find({
      where: { id: In(applications.map(({ jobSeekerId }) => jobSeekerId)) },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        location: true,
        skills: true,
      },
    });
    const applicantsById = new Map<number, ApplicantSummary>(
      applicants.map((applicant) => [applicant.id, applicant]),
    );

    return applications.map((application) => ({
      ...this.presentApplication(application),
      applicant: applicantsById.get(application.jobSeekerId) ?? null,
    }));
  }

  async update(
    applicationId: number,
    jobSeekerId: number,
    dto: UpdateApplicationDto,
  ) {
    const coverLetter = dto.coverLetter;
    if (typeof coverLetter !== 'string' || !coverLetter.trim()) {
      throw new BadRequestException(
        'A non-empty cover letter is required when updating an application.',
      );
    }

    return this.applicationRepository.manager.transaction(async (manager) => {
      const applications = manager.getRepository(Application);
      const lockedApplication = await applications.findOne({
        where: { applicationId, jobSeekerId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!lockedApplication) {
        throw new NotFoundException('Application not found.');
      }
      const application = await applications.findOne({
        where: { applicationId, jobSeekerId },
        relations: { job: true, documents: true },
      });
      if (!application) {
        throw new NotFoundException('Application not found.');
      }
      if (application.status !== ApplicationStatus.SUBMITTED) {
        throw new BadRequestException(
          'A cover letter can only be edited before an employer reviews the application.',
        );
      }

      application.coverLetter = coverLetter.trim();
      return this.presentApplication(await applications.save(application));
    });
  }

  async updateStatus(
    applicationId: number,
    employerId: number,
    dto: UpdateApplicationStatusDto,
  ) {
    const saved = await this.applicationRepository.manager.transaction(
      async (manager) => {
        const applications = manager.getRepository(Application);
        const lockedApplication = await applications.findOne({
          where: { applicationId },
          lock: { mode: 'pessimistic_write' },
        });
        if (!lockedApplication) {
          throw new NotFoundException('Application not found.');
        }
        const application = await applications.findOne({
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
        const allowedTransitions =
          ALLOWED_STATUS_TRANSITIONS[application.status];
        if (!allowedTransitions?.includes(dto.status)) {
          throw new BadRequestException(
            `Application status cannot change from ${application.status} to ${dto.status}.`,
          );
        }

        application.status = dto.status;
        return applications.save(application);
      },
    );
    const isShortlisted = saved.status === ApplicationStatus.SHORTLISTED;
    await this.notifyUser(
      saved.jobSeekerId,
      isShortlisted
        ? `Congratulations! Your application for "${saved.job.title}" has been shortlisted.`
        : `The status of your application for "${saved.job.title}" is now ${saved.status}.`,
      isShortlisted
        ? 'Congratulations, you have been shortlisted'
        : 'Application status update',
    );

    return this.findOne(saved.applicationId, saved.jobSeekerId);
  }

  async remove(applicationId: number, jobSeekerId: number): Promise<void> {
    await this.withdraw(applicationId, jobSeekerId);
  }

  async withdraw(applicationId: number, jobSeekerId: number): Promise<void> {
    const documents = await this.applicationRepository.manager.transaction(
      async (manager) => {
        const applications = manager.getRepository(Application);
        const documentRepository = manager.getRepository(ApplicationDocument);
        const application = await applications.findOne({
          where: { applicationId, jobSeekerId },
          lock: { mode: 'pessimistic_write' },
        });
        if (!application) {
          throw new NotFoundException('Application not found.');
        }
        if (
          application.status === ApplicationStatus.HIRED ||
          application.status === ApplicationStatus.REJECTED ||
          application.status === ApplicationStatus.WITHDRAWN
        ) {
          throw new BadRequestException(
            'This application can no longer be withdrawn.',
          );
        }

        const applicationDocuments = await documentRepository.find({
          where: { applicationId },
        });
        application.status = ApplicationStatus.WITHDRAWN;
        await applications.save(application);
        if (applicationDocuments.length > 0) {
          await documentRepository.remove(applicationDocuments);
        }
        return applicationDocuments;
      },
    );
    this.removeStoredFiles(documents);
    await this.notifyUser(
      jobSeekerId,
      'Your application has been withdrawn.',
      'Application withdrawn',
    );
  }

  async getDocumentForUser(
    documentId: number,
    userId: number,
    role: UserRole,
  ): Promise<ApplicationDocument> {
    const document = await this.documentRepository.findOne({
      where: { documentId },
      relations: {
        application: {
          job: { postedBy: true },
        },
      },
    });
    if (!document) {
      throw new NotFoundException('Document not found.');
    }

    const isApplicant = document.application.jobSeekerId === userId;
    const isEmployer =
      role === 'employer' && document.application.job.postedBy?.id === userId;
    if (
      (!isApplicant && !isEmployer) ||
      document.application.status === ApplicationStatus.WITHDRAWN
    ) {
      throw new ForbiddenException('You do not have access to this document.');
    }

    const filePath = join(UPLOAD_DIR, basename(document.storedName));
    if (!existsSync(filePath)) {
      throw new NotFoundException('The application document is unavailable.');
    }
    document.filePath = filePath;
    return document;
  }

  private async notifyUser(
    userId: number,
    message: string,
    subject: string,
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
          subject,
        });
      }
    } catch (error) {
      this.logger.error(
        `Could not create  an application notification for user ${userId}.`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
