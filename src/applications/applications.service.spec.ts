
import { ConflictException } from '@nestjs/common';
import type { Repository } from 'typeorm';
<<<<<<< HEAD
import { Job } from '../jobs/entities/jobs.entity.js';
import { JobStatus } from '../jobs/entities/jobs.entity.js';
import { ApplicationStatus } from './entities/application.entity.js';
=======
import type { Express } from 'express';
import { vi } from 'vitest';

import { Job, JobStatus } from '../jobs/entities/jobs.entity.js';
>>>>>>> 4f93cc2 (Updated application module)
import { JobService } from '../jobs/jobs.service.js';

import { Application } from './entities/application.entity.js';
import { ApplicationDocument } from './entities/application-document.entity.js';
import { ApplicationsService } from './applications.service.js';

import { User } from '../authentication/entities/user.entity.js';
import { NotificationsService } from '../notification/notification.service.js';

describe('ApplicationsService', () => {
  const applicationRepository = {
    findOne: vi.fn(),
    create: vi.fn(),
    save: vi.fn(),
    remove: vi.fn(),
  };

  const documentRepository = {
    create: vi.fn(),
    save: vi.fn(),
    find: vi.fn(),
    remove: vi.fn(),
  };

  const jobService = {
    getOneJob: vi.fn(),
  };
<<<<<<< HEAD
  const userRepository = { findOne: vi.fn().mockResolvedValue(null) };
  const notificationsService = { create: vi.fn() };
=======

  const userRepository = {
    findOne: vi.fn(),
  };

  const notificationsService = {
    create: vi.fn(),
  };

>>>>>>> 4f93cc2 (Updated application module)
  let service: ApplicationsService;

  beforeEach(() => {
    vi.clearAllMocks();

    service = new ApplicationsService(
      applicationRepository as unknown as Repository<Application>,
      documentRepository as unknown as Repository<ApplicationDocument>,
      jobService as unknown as JobService,
<<<<<<< HEAD
      userRepository as never,
      notificationsService as never,
=======
      userRepository as unknown as Repository<User>,
      notificationsService as unknown as NotificationsService,
>>>>>>> 4f93cc2 (Updated application module)
    );
  });

  it('creates an application against a real job and the supplied jobseeker', async () => {
    const job = {
      id: 'job-uuid',
      title: 'Engineer',
<<<<<<< HEAD
      status: JobStatus.APPROVED,
    } as Job;
    const application = { job, jobSeekerId: 7 };
=======
      status: JobStatus.OPEN,
    } as Job;

    const application = {
      applicationId: 10,
      job,
      jobSeekerId: 7,
    } as Application;

    const cv = {
      originalname: 'cv.pdf',
      path: '/tmp/cv.pdf',
      mimetype: 'application/pdf',
      size: 100,
    } as Express.Multer.File;

>>>>>>> 4f93cc2 (Updated application module)
    jobService.getOneJob.mockResolvedValue(job);

    applicationRepository.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(application);

    applicationRepository.create.mockReturnValue(application);
    applicationRepository.save.mockResolvedValue(application);

    documentRepository.create.mockReturnValue({});
    documentRepository.save.mockResolvedValue([]);

    userRepository.findOne.mockResolvedValue(null);

    await expect(
      service.create(
        {
          jobId: job.id,
          coverLetter: 'Interested in the role.',
        },
        7,
        cv,
      ),
    ).resolves.toBe(application);

    expect(jobService.getOneJob).toHaveBeenCalledWith(job.id);

    expect(applicationRepository.create).toHaveBeenCalledWith({
      job,
      jobSeekerId: 7,
      coverLetter: 'Interested in the role.',
<<<<<<< HEAD
      status: ApplicationStatus.SUBMITTED,
=======
      status: expect.any(String),
>>>>>>> 4f93cc2 (Updated application module)
    });

    expect(documentRepository.save).toHaveBeenCalled();
  });

  it('prevents a jobseeker from applying to the same job twice', async () => {
<<<<<<< HEAD
    jobService.getOneJob.mockResolvedValue({
      id: 'job-uuid',
      status: JobStatus.APPROVED,
    });
    applicationRepository.findOne.mockResolvedValue({ applicationId: 1 });
=======
    const cv = {
      originalname: 'cv.pdf',
      path: '/tmp/cv.pdf',
      mimetype: 'application/pdf',
      size: 100,
    } as Express.Multer.File;

    jobService.getOneJob.mockResolvedValue({
      id: 'job-uuid',
      status: JobStatus.OPEN,
    });

    applicationRepository.findOne.mockResolvedValue({
      applicationId: 1,
    });
>>>>>>> 4f93cc2 (Updated application module)

    await expect(
      service.create(
        { jobId: 'job-uuid' },
        7,
        cv,
      ),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(applicationRepository.create).not.toHaveBeenCalled();
  });
});
