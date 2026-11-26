import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import type { Repository } from 'typeorm';
import type { Express } from 'express';
import { vi } from 'vitest';

import { Job, JobStatus } from '../jobs/entities/jobs.entity.js';
import { JobService } from '../jobs/jobs.service.js';
import { User } from '../authentication/entities/user.entity.js';
import { NotificationsService } from '../notification/notification.service.js';

import {
  Application,
  ApplicationStatus,
} from './entities/application.entity.js';
import {
  ApplicationDocument,
  ApplicationDocumentType,
} from './entities/application-document.entity.js';

import { ApplicationsService } from './applications.service.js';

describe('ApplicationsService', () => {
  const applicationRepository = {
    find: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn((application) => application),
    save: vi.fn((application) => Promise.resolve(application)),
    manager: {
      transaction: vi.fn(),
    },
  };
  const documentRepository = {
    create: vi.fn((document) => document),
    save: vi.fn((documents) => Promise.resolve(documents)),
    find: vi.fn(),
    remove: vi.fn((documents) => Promise.resolve(documents)),
  };
  const manager = {
    getRepository: vi.fn((entity) =>
      entity === Application ? applicationRepository : documentRepository,
    ),
  };

  const jobService = {
    getOneJob: vi.fn(),
  };
  const userRepository = {
    findOne: vi.fn().mockResolvedValue(null),
    find: vi.fn(),
  };
  const notificationsService = { create: vi.fn() };

  let service: ApplicationsService;

  beforeEach(() => {
    vi.clearAllMocks();
    applicationRepository.create.mockImplementation(
      (application) => application,
    );
    applicationRepository.save.mockImplementation((application) =>
      Promise.resolve(application),
    );
    documentRepository.create.mockImplementation((document) => document);
    documentRepository.save.mockImplementation((documents) =>
      Promise.resolve(documents),
    );
    applicationRepository.manager.transaction.mockImplementation((work) =>
      work(manager),
    );
    service = new ApplicationsService(
      applicationRepository as unknown as Repository<Application>,
      documentRepository as unknown as Repository<ApplicationDocument>,
      jobService as unknown as JobService,
      userRepository as unknown as Repository<User>,
      notificationsService as unknown as NotificationsService,
    );
  });

  it('creates an application with a CV and supporting documents', async () => {
    const job = {
      id: 'job-uuid',
      title: 'Engineer',
      status: JobStatus.APPROVED,
      applicationRequirements: [
        {
          fieldKey: 'cv',
          fieldLabel: 'CV / Resume',
          isEnabled: 1,
          isRequired: 1,
        },
        {
          fieldKey: 'coverLetter',
          fieldLabel: 'Cover letter',
          isEnabled: 1,
          isRequired: 0,
        },
      ],
    } as Job;

    const application = {
      applicationId: 5,
      job,
      jobSeekerId: 7,
      status: ApplicationStatus.SUBMITTED,
      coverLetter: null,
      answers: '{}',
      appliedAt: new Date(),
      updatedAt: new Date(),
      documents: [],
    } as Application;

    const cv = {
      originalname: 'cv.pdf',
      path: '/tmp/cv-uuid.pdf',
      mimetype: 'application/pdf',
      size: 10,
    } as Express.Multer.File;
    jobService.getOneJob.mockResolvedValue(job);
    applicationRepository.save.mockResolvedValue(application);
    documentRepository.save.mockResolvedValue([]);
    applicationRepository.findOne.mockResolvedValue(null);

    await expect(
      service.create(
        { jobId: job.id, coverLetter: ' Interested in the role. ' },
        7,
        cv,
      ),
    ).resolves.toMatchObject({
      applicationId: 5,
      status: ApplicationStatus.SUBMITTED,
      documents: [expect.objectContaining({ documentType: ApplicationDocumentType.CV })],
    });

    expect(jobService.getOneJob).toHaveBeenCalledWith(job.id);
    expect(applicationRepository.manager.transaction).toHaveBeenCalledOnce();
    expect(applicationRepository.create).toHaveBeenCalledWith({
      job,
      jobSeekerId: 7,
      coverLetter: 'Interested in the role.',
      answers: '{}',
      status: expect.any(String),
    });
    expect(documentRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        applicationId: 5,
        documentType: ApplicationDocumentType.CV,
        storedName: 'cv-uuid.pdf',
      }),
    );
    expect(notificationsService.create).toHaveBeenCalledWith({
      userId: 7,
      email: 'candidate@example.com',
      subject: 'Application received',
      message: 'Your application for "Engineer" was submitted successfully.',
    });
  });

  it('prevents a jobseeker from applying to the same job twice', async () => {
    const cv = {
      originalname: 'cv.pdf',
      mimetype: 'application/pdf',
      size: 10,
      path: '/tmp/nonexistent-cv.pdf',
    } as Express.Multer.File;
    jobService.getOneJob.mockResolvedValue({
      id: 'job-uuid',
      status: JobStatus.APPROVED,
      applicationRequirements: [
        {
          fieldKey: 'cv',
          fieldLabel: 'CV / Resume',
          isEnabled: 1,
          isRequired: 1,
        },
      ],
    });
    applicationRepository.findOne.mockResolvedValue({ applicationId: 1 });

    await expect(
      service.create({ jobId: 'job-uuid' }, 7, cv),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(applicationRepository.create).not.toHaveBeenCalled();
  });

  it('requires a CV when the job marks the CV field as required', async () => {
    jobService.getOneJob.mockResolvedValue({
      id: 'job-uuid',
      title: 'Engineer',
      status: JobStatus.APPROVED,
      applicationRequirements: [
        {
          fieldKey: 'cv',
          fieldLabel: 'CV / Resume',
          isEnabled: 1,
          isRequired: 1,
        },
      ],
    });

    await expect(
      service.create({ jobId: 'job-uuid' }, 7, undefined, []),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(jobService.getOneJob).toHaveBeenCalledWith('job-uuid');
  });

  it('does not expose server file paths in application responses', async () => {
    applicationRepository.findOne.mockResolvedValue({
      applicationId: 5,
      jobSeekerId: 7,
      job: { id: 'job-uuid' },
      documents: [
        {
          documentId: 2,
          filePath: '/private/uploads/cv.pdf',
          storedName: 'cv-uuid.pdf',
          originalName: 'cv.pdf',
        },
      ],
    });

    await expect(service.findOne(5, 7)).resolves.toMatchObject({
      documents: [
        {
          documentId: 2,
          originalName: 'cv.pdf',
          downloadUrl: '/api/v1/applications/documents/2/download',
        },
      ],
    });
    const result = await service.findOne(5, 7);
    expect(result.documents[0]).not.toHaveProperty('filePath');
    expect(result.documents[0]).not.toHaveProperty('storedName');
  });

  it('updates only the cover letter before employer review', async () => {
    const application = {
      applicationId: 5,
      jobSeekerId: 7,
      status: ApplicationStatus.SUBMITTED,
      coverLetter: 'Old letter',
      answers: null,
      appliedAt: new Date(),
      updatedAt: new Date(),
      job: { id: 'job-uuid' } as Job,
      documents: [],
    } as Application;
    applicationRepository.findOne.mockResolvedValue(application);

    await service.update(5, 7, { coverLetter: ' New letter ' });

    expect(application.coverLetter).toBe('New letter');
    expect(application.status).toBe(ApplicationStatus.SUBMITTED);
    expect(applicationRepository.save).toHaveBeenCalledWith(application);
  });

  it('allows only valid employer status transitions for the employer’s own job', async () => {
    const application = {
      applicationId: 5,
      jobSeekerId: 7,
      status: ApplicationStatus.IN_REVIEW,
      coverLetter: null,
      answers: null,
      appliedAt: new Date(),
      updatedAt: new Date(),
      job: { title: 'Engineer', postedBy: { id: 12 } } as unknown as Job,
      documents: [],
    } as Application;
    applicationRepository.findOne.mockResolvedValue(application);
    userRepository.findOne.mockResolvedValue({
      email: 'candidate@example.com',
    });

    await service.updateStatus(5, 12, {
      status: ApplicationStatus.SHORTLISTED,
    });

    expect(application.status).toBe(ApplicationStatus.SHORTLISTED);
    expect(applicationRepository.save).toHaveBeenCalledWith(application);
    expect(notificationsService.create).toHaveBeenCalledWith({
      userId: 7,
      email: 'candidate@example.com',
      subject: 'Congratulations, you have been shortlisted',
      message:
        'Congratulations! Your application for "Engineer" has been shortlisted.',
    });
  });

  it('rejects invalid status transitions and updates by a different employer', async () => {
    const application = {
      applicationId: 5,
      jobSeekerId: 7,
      status: ApplicationStatus.SUBMITTED,
      coverLetter: null,
      answers: null,
      appliedAt: new Date(),
      updatedAt: new Date(),
      job: { postedBy: { id: 12 } },
    } as Application;
    applicationRepository.findOne.mockResolvedValue(application);

    await expect(
      service.updateStatus(5, 12, { status: ApplicationStatus.HIRED }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.updateStatus(5, 99, {
        status: ApplicationStatus.IN_REVIEW,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(applicationRepository.save).not.toHaveBeenCalled();
  });

  it('withdraws an application without deleting its history', async () => {
    const application = {
      applicationId: 5,
      jobSeekerId: 7,
      status: ApplicationStatus.SUBMITTED,
      coverLetter: null,
      answers: null,
      appliedAt: new Date(),
      updatedAt: new Date(),
      job: { id: 'job-uuid' } as Job,
      documents: [],
    } as Application;
    applicationRepository.findOne.mockResolvedValue(application);
    documentRepository.find.mockResolvedValue([]);
    userRepository.findOne.mockResolvedValue({
      email: 'candidate@example.com',
    });

    await service.remove(5, 7);

    expect(application.status).toBe(ApplicationStatus.WITHDRAWN);
    expect(applicationRepository.save).toHaveBeenCalledWith(application);
    expect(applicationRepository.manager.transaction).toHaveBeenCalledOnce();
    expect(notificationsService.create).toHaveBeenCalledWith({
      userId: 7,
      email: 'candidate@example.com',
      subject: 'Application withdrawn',
      message: 'Your application has been withdrawn.',
    });
  });
});
