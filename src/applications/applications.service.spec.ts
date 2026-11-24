import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import type { Repository } from 'typeorm';
import { Job } from '../jobs/entities/jobs.entity.js';
import { JobStatus } from '../jobs/entities/jobs.entity.js';
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
    } as Job;
    const application = {
      applicationId: 5,
      job,
      jobSeekerId: 7,
      status: ApplicationStatus.SUBMITTED,
      documents: [],
    } as Application;
    const cv = {
      originalname: 'cv.pdf',
      mimetype: 'application/pdf',
      size: 10,
      path: '/tmp/cv-uuid.pdf',
    } as Express.Multer.File;
    jobService.getOneJob.mockResolvedValue(job);
    applicationRepository.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(application);
    applicationRepository.create.mockReturnValue(application);
    applicationRepository.save.mockResolvedValue(application);
    documentRepository.create.mockImplementation((document) => document);
    documentRepository.save.mockResolvedValue([]);

    await expect(
      service.create(
        { jobId: job.id, coverLetter: ' Interested in the role. ' },
        7,
        cv,
      ),
    ).resolves.toMatchObject({
      applicationId: 5,
      status: ApplicationStatus.SUBMITTED,
      documents: [],
    });

    expect(jobService.getOneJob).toHaveBeenCalledWith(job.id);
    expect(applicationRepository.manager.transaction).toHaveBeenCalledOnce();
    expect(applicationRepository.create).toHaveBeenCalledWith({
      job,
      jobSeekerId: 7,
      coverLetter: 'Interested in the role.',
      status: ApplicationStatus.SUBMITTED,
    });
    expect(documentRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        applicationId: 5,
        documentType: ApplicationDocumentType.CV,
        storedName: 'cv-uuid.pdf',
      }),
    );
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
    });
    applicationRepository.findOne.mockResolvedValue({ applicationId: 1 });

    await expect(
      service.create({ jobId: 'job-uuid' }, 7, cv),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(applicationRepository.create).not.toHaveBeenCalled();
  });

  it('requires a CV for every application', async () => {
    await expect(
      service.create({ jobId: 'job-uuid' }, 7, undefined, []),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(jobService.getOneJob).not.toHaveBeenCalled();
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
      job: { title: 'Engineer', postedBy: { id: 12 } },
      documents: [],
    } as Application;
    applicationRepository.findOne.mockResolvedValue(application);

    await service.updateStatus(5, 12, {
      status: ApplicationStatus.SHORTLISTED,
    });

    expect(application.status).toBe(ApplicationStatus.SHORTLISTED);
    expect(applicationRepository.save).toHaveBeenCalledWith(application);
  });

  it('rejects invalid status transitions and updates by a different employer', async () => {
    const application = {
      applicationId: 5,
      jobSeekerId: 7,
      status: ApplicationStatus.SUBMITTED,
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
      documents: [],
    } as Application;
    applicationRepository.findOne.mockResolvedValue(application);
    documentRepository.find.mockResolvedValue([]);

    await service.remove(5, 7);

    expect(application.status).toBe(ApplicationStatus.WITHDRAWN);
    expect(applicationRepository.save).toHaveBeenCalledWith(application);
    expect(applicationRepository.manager.transaction).toHaveBeenCalledOnce();
  });

  it('lists and retrieves applications for admin monitoring with job details', async () => {
    const pagination = { page: 2, limit: 10 } as never;
    const application = {
      applicationId: 5,
      job: { id: 'job-id', company: { companyId: 2 } },
    };
    applicationRepository.find.mockResolvedValue([application]);
    applicationRepository.findOne.mockResolvedValue(application);

    await expect(service.getAdminApplications(pagination)).resolves.toEqual([
      application,
    ]);
    expect(applicationRepository.find).toHaveBeenCalledWith(
      expect.objectContaining({
        relations: { job: { company: true } },
        order: { appliedAt: 'DESC' },
        skip: 10,
        take: 10,
      }),
    );
    await expect(service.getAdminApplicationById(5)).resolves.toBe(
      application,
    );

    applicationRepository.findOne.mockResolvedValue(null);
    await expect(service.getAdminApplicationById(404)).rejects.toThrow(
      NotFoundException,
    );
  });
});
