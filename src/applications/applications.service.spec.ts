import { ConflictException } from '@nestjs/common';
import type { Repository } from 'typeorm';
import { Job } from '../jobs/entities/jobs.entity.js';
import { JobStatus } from '../jobs/entities/jobs.entity.js';
import { ApplicationStatus } from './entities/application.entity.js';
import { JobService } from '../jobs/jobs.service.js';
import { Application } from './entities/application.entity.js';
import { ApplicationsService } from './applications.service.js';

describe('ApplicationsService', () => {
  const applicationRepository = {
    findOne: vi.fn(),
    create: vi.fn(),
    save: vi.fn(),
  };
  const jobService = {
    getOneJob: vi.fn(),
  };
  const userRepository = { findOne: vi.fn().mockResolvedValue(null) };
  const notificationsService = { create: vi.fn() };
  let service: ApplicationsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ApplicationsService(
      applicationRepository as unknown as Repository<Application>,
      jobService as unknown as JobService,
      userRepository as never,
      notificationsService as never,
    );
  });

  it('creates an application against a real job and the supplied jobseeker', async () => {
    const job = {
      id: 'job-uuid',
      title: 'Engineer',
      status: JobStatus.APPROVED,
    } as Job;
    const application = { job, jobSeekerId: 7 };
    jobService.getOneJob.mockResolvedValue(job);
    applicationRepository.findOne.mockResolvedValue(null);
    applicationRepository.create.mockReturnValue(application);
    applicationRepository.save.mockResolvedValue(application);

    await expect(
      service.create(
        { jobId: job.id, coverLetter: 'Interested in the role.' },
        7,
      ),
    ).resolves.toBe(application);
    expect(jobService.getOneJob).toHaveBeenCalledWith(job.id);
    expect(applicationRepository.findOne).toHaveBeenCalledWith({
      where: { job: { id: job.id }, jobSeekerId: 7 },
    });
    expect(applicationRepository.create).toHaveBeenCalledWith({
      job,
      jobSeekerId: 7,
      coverLetter: 'Interested in the role.',
      status: ApplicationStatus.SUBMITTED,
    });
  });

  it('prevents a jobseeker from applying to the same job twice', async () => {
    jobService.getOneJob.mockResolvedValue({
      id: 'job-uuid',
      status: JobStatus.APPROVED,
    });
    applicationRepository.findOne.mockResolvedValue({ applicationId: 1 });

    await expect(
      service.create({ jobId: 'job-uuid' }, 7),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(applicationRepository.create).not.toHaveBeenCalled();
  });
});
