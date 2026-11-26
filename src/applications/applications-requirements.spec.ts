import { BadRequestException } from '@nestjs/common';
import type { Repository } from 'typeorm';
import { vi } from 'vitest';

import { Job, JobStatus } from '../jobs/entities/jobs.entity.js';
import { JobService } from '../jobs/jobs.service.js';
import { User } from '../authentication/entities/user.entity.js';
import { NotificationsService } from '../notification/notification.service.js';
import { Application } from './entities/application.entity.js';
import { ApplicationDocument } from './entities/application-document.entity.js';
import { ApplicationsService } from './applications.service.js';

describe('ApplicationsService job-specific requirements', () => {
  const applicationRepository = {
    create: vi.fn((application) => application),
    findOne: vi.fn(),
    save: vi.fn((application) => Promise.resolve(application)),
    manager: {
      transaction: vi.fn(),
    },
  };
  const documentRepository = {
    create: vi.fn((document) => document),
    save: vi.fn((documents) => Promise.resolve(documents)),
  };
  const manager = {
    getRepository: vi.fn((entity) =>
      entity === Application ? applicationRepository : documentRepository,
    ),
  };
  const jobService = { getOneJob: vi.fn() };
  const userRepository = { findOne: vi.fn().mockResolvedValue(null) };
  const notificationsService = { create: vi.fn() };

  let service: ApplicationsService;

  beforeEach(() => {
    vi.clearAllMocks();
    userRepository.findOne.mockResolvedValue(null);
    applicationRepository.manager.transaction.mockImplementation((work) =>
      work(manager),
    );
    applicationRepository.findOne.mockResolvedValue(null);
    documentRepository.save.mockResolvedValue([]);
    service = new ApplicationsService(
      applicationRepository as unknown as Repository<Application>,
      documentRepository as unknown as Repository<ApplicationDocument>,
      jobService as unknown as JobService,
      userRepository as unknown as Repository<User>,
      notificationsService as unknown as NotificationsService,
    );
  });

  it('requires only the fields enabled and marked required for the job', async () => {
    jobService.getOneJob.mockResolvedValue({
      id: 'job-id',
      title: 'Engineer',
      status: JobStatus.APPROVED,
      applicationRequirements: [
        {
          fieldKey: 'highestEducation',
          fieldLabel: 'Highest education',
          isEnabled: 1,
          isRequired: 1,
        },
        {
          fieldKey: 'cv',
          fieldLabel: 'CV / Resume',
          isEnabled: 0,
          isRequired: 0,
        },
      ],
    } as Job);

    await expect(service.create({ jobId: 'job-id' }, 7)).rejects.toThrow(
      'Highest education is required for this application.',
    );

    expect(applicationRepository.manager.transaction).not.toHaveBeenCalled();
  });

  it('accepts a job-specific response without a CV and persists selected answers', async () => {
    const job = {
      id: 'job-id',
      title: 'Engineer',
      status: JobStatus.APPROVED,
      applicationRequirements: [
        {
          fieldKey: 'highestEducation',
          fieldLabel: 'Highest education',
          isEnabled: 1,
          isRequired: 1,
        },
        {
          fieldKey: 'yearsOfExperience',
          fieldLabel: 'Years of experience',
          isEnabled: 1,
          isRequired: 0,
        },
        {
          fieldKey: 'cv',
          fieldLabel: 'CV / Resume',
          isEnabled: 0,
          isRequired: 0,
        },
      ],
    } as Job;
    jobService.getOneJob.mockResolvedValue(job);
    applicationRepository.save.mockImplementation((application) =>
      Promise.resolve({ ...application, applicationId: 4 }),
    );

    await expect(
      service.create(
        {
          jobId: 'job-id',
          highestEducation: "Bachelor's degree",
          yearsOfExperience: 3,
        },
        7,
      ),
    ).resolves.toMatchObject({
      applicationId: 4,
      answers: {
        highestEducation: "Bachelor's degree",
        yearsOfExperience: 3,
      },
      documents: [],
    });

    expect(applicationRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        answers: JSON.stringify({
          highestEducation: "Bachelor's degree",
          yearsOfExperience: 3,
        }),
      }),
    );
    expect(documentRepository.save).toHaveBeenCalledWith([]);
  });

  it('requires a CV when the job marks the CV field as required', async () => {
    jobService.getOneJob.mockResolvedValue({
      id: 'job-id',
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
    } as Job);

    await expect(service.create({ jobId: 'job-id' }, 7)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(applicationRepository.manager.transaction).not.toHaveBeenCalled();
  });
});
