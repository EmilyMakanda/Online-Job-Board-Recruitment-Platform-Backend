import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import type { Repository } from 'typeorm';
import { Job } from './entities/jobs.entity.js';
import { JobStatus } from './entities/jobs.entity.js';
import { User } from '../authentication/entities/user.entity.js';
import { Company } from '../company/entities/company.entity.js';
import { JobService } from './jobs.service.js';

describe('JobService', () => {
  const jobRepository = {
    find: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
    save: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    createQueryBuilder: vi.fn(),
    manager: {
      transaction: vi.fn(),
    },
  };
  const transactionManager = {
    getRepository: vi.fn(() => jobRepository),
  };
  const userRepository = { findOne: vi.fn() };
  const companyRepository = { findOneBy: vi.fn() };
  let service: JobService;

  beforeEach(() => {
    vi.clearAllMocks();
    jobRepository.manager.transaction.mockImplementation((work) =>
      work(transactionManager),
    );
    service = new JobService(
      jobRepository as unknown as Repository<Job>,
      userRepository as unknown as Repository<User>,
      companyRepository as unknown as Repository<Company>,
    );
  });

  it('creates a pending job associated with the authenticated employer company', async () => {
    const user = { id: 12 } as User;
    const company = {
      companyId: 3,
      employerId: 12,
      verificationStatus: 'verified',
    } as unknown as Company;
    const job = { id: 'job-id', status: JobStatus.PENDING } as Job;
    userRepository.findOne.mockResolvedValue(user);
    companyRepository.findOneBy.mockResolvedValue(company);
    jobRepository.create.mockReturnValue(job);
    jobRepository.save.mockResolvedValue(job);

    await expect(
      service.createJob(
        {
          title: 'Engineer',
          description: 'Build software',
          location: 'Remote',
          deadline: new Date('2099-07-15T23:59:59.000Z'),
        },
        12,
      ),
    ).resolves.toBe(job);
    expect(companyRepository.findOneBy).toHaveBeenCalledWith({
      employerId: 12,
    });
    expect(jobRepository.create).toHaveBeenCalledWith({
      title: 'Engineer',
      description: 'Build software',
      location: 'Remote',
      deadline: new Date('2099-07-15T23:59:59.000Z'),
      status: JobStatus.PENDING,
      postedBy: user,
      company,
      applicationRequirements: [
        {
          fieldKey: 'cv',
          fieldLabel: 'CV / Resume',
          isEnabled: 1,
          isRequired: 1,
        },
      ],
    });
  });

  it('saves employer-selected required fields with the new job', async () => {
    userRepository.findOne.mockResolvedValue({ id: 12 });
    companyRepository.findOneBy.mockResolvedValue({
      employerId: 12,
      verificationStatus: 'verified',
    });
    jobRepository.create.mockImplementation((job) => job);
    jobRepository.save.mockImplementation((job) => Promise.resolve(job));

    await service.createJob(
      {
        title: 'Engineer',
        description: 'Build software',
        location: 'Remote',
        deadline: new Date('2099-07-15T23:59:59.000Z'),
        applicationRequirements: [
          {
            fieldKey: 'highestEducation',
            fieldLabel: 'Highest education',
            isEnabled: true,
            isRequired: true,
          },
        ],
      },
      12,
    );

    expect(jobRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        applicationRequirements: [
          {
            fieldKey: 'highestEducation',
            fieldLabel: 'Highest education',
            isEnabled: 1,
            isRequired: 1,
          },
        ],
      }),
    );
  });

  it('does not allow a disabled application field to be required', async () => {
    userRepository.findOne.mockResolvedValue({ id: 12 });
    companyRepository.findOneBy.mockResolvedValue({
      employerId: 12,
      verificationStatus: 'verified',
    });

    await expect(
      service.createJob(
        {
          title: 'Engineer',
          description: 'Build software',
          location: 'Remote',
          deadline: new Date('2099-07-15T23:59:59.000Z'),
          applicationRequirements: [
            {
              fieldKey: 'cv',
              fieldLabel: 'CV',
              isEnabled: false,
              isRequired: true,
            },
          ],
        },
        12,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(jobRepository.save).not.toHaveBeenCalled();
  });

  it('does not allow an employer without a company to create a job', async () => {
    userRepository.findOne.mockResolvedValue({ id: 12 });
    companyRepository.findOneBy.mockResolvedValue(null);

    await expect(
      service.createJob(
        {
          title: 'Software Engineer',
          description: 'Build software',
          location: 'Remote',
          deadline: new Date('2099-07-15T23:59:59.000Z'),
        },
        12,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(jobRepository.save).not.toHaveBeenCalled();
  });

  it('does not allow an employer with an unverified company to post jobs', async () => {
    userRepository.findOne.mockResolvedValue({ id: 12 });
    companyRepository.findOneBy.mockResolvedValue({
      employerId: 12,
      verificationStatus: 'pending',
    });

    await expect(
      service.createJob(
        {
          title: 'Engineer',
          description: 'Build software',
          location: 'Remote',
          deadline: new Date('2099-07-15T23:59:59.000Z'),
        },
        12,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(jobRepository.save).not.toHaveBeenCalled();
  });

  it('rejects whitespace-only job fields after trimming', async () => {
    userRepository.findOne.mockResolvedValue({ id: 12 });
    companyRepository.findOneBy.mockResolvedValue({
      employerId: 12,
      verificationStatus: 'verified',
    });

    await expect(
      service.createJob(
        {
          title: '   ',
          description: 'Build software',
          location: 'Remote',
          deadline: new Date('2099-07-15T23:59:59.000Z'),
        },
        12,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(jobRepository.save).not.toHaveBeenCalled();
  });

  it('lists jobs associated with the requested employer company', async () => {
    const jobs = [{ id: 'job-id' }] as Job[];
    jobRepository.find.mockResolvedValue(jobs);

    await expect(service.getJobsByEmployer(12)).resolves.toBe(jobs);
    expect(jobRepository.find).toHaveBeenCalledWith({
      where: { company: { employerId: 12 } },
      relations: { company: true, applicationRequirements: true },
      order: { createdAt: 'DESC' },
    });
  });

  it('lists only approved jobs to job seekers', async () => {
    jobRepository.find.mockResolvedValue([]);

    await service.getAllJobs();

    expect(jobRepository.find).toHaveBeenCalledWith({
      where: {
        status: JobStatus.APPROVED,
        deadline: expect.objectContaining({ _type: 'moreThan' }),
        company: { verificationStatus: 'verified' },
      },
      relations: { company: true, applicationRequirements: true },
      order: { createdAt: 'DESC' },
    });
  });

  it('does not return another employer listing by ID', async () => {
    jobRepository.findOne.mockResolvedValue(null);

    await expect(
      service.getOneJobForEmployer('job-id', 12),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(jobRepository.findOne).toHaveBeenCalledWith({
      where: { id: 'job-id', company: { employerId: 12 } },
      relations: { company: true, applicationRequirements: true },
    });
  });

  it('searches approved jobs by title, description, or location without regard to case', async () => {
    const jobs = [{ id: 'job-id' }] as Job[];
    const queryBuilder = {
      leftJoinAndSelect: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      andWhere: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      getMany: vi.fn().mockResolvedValue(jobs),
    };
    jobRepository.createQueryBuilder.mockReturnValue(queryBuilder);

    await expect(service.searchJobsByName('Engineer')).resolves.toBe(jobs);
    expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
      'job.company',
      'company',
    );
    expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
      'job.applicationRequirements',
      'applicationRequirements',
    );
    expect(queryBuilder.where).toHaveBeenCalledWith('job.status = :status', {
      status: JobStatus.APPROVED,
    });
    expect(queryBuilder.andWhere).toHaveBeenCalledWith('job.deadline > :now', {
      now: expect.any(Date),
    });
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'company.verificationStatus = :companyStatus',
      { companyStatus: 'verified' },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      '(LOWER(job.title) LIKE LOWER(:term) OR LOWER(job.description) LIKE LOWER(:term) OR LOWER(job.location) LIKE LOWER(:term))',
      { term: '%Engineer%' },
    );
    expect(queryBuilder.orderBy).toHaveBeenCalledWith('job.createdAt', 'DESC');
  });

  it('requires a non-empty search query', async () => {
    expect(() => service.searchJobsByName('   ')).toThrow(BadRequestException);
  });

  it('updates only a job associated with the employer company', async () => {
    const job = { title: 'Old title' } as Job;
    jobRepository.findOne.mockResolvedValue(job);
    jobRepository.save.mockResolvedValue({ ...job, title: 'New title' });

    await service.updateJob('job-id', { title: 'New title' }, 12);

    expect(jobRepository.findOne).toHaveBeenCalledWith({
      where: { id: 'job-id', company: { employerId: 12 } },
      relations: { company: true, applicationRequirements: true },
    });
    expect(job.title).toBe('New title');
    expect(jobRepository.save).toHaveBeenCalledWith(job);
  });

  it('updates a job deadline', async () => {
    const job = { deadline: new Date('2099-07-01T21:59:59.999Z') } as Job;
    jobRepository.findOne.mockResolvedValue(job);
    jobRepository.save.mockResolvedValue(job);

    const deadline = new Date('2099-07-15T23:59:59.000Z');
    await service.updateJob('job-id', { deadline }, 12);

    expect(job.deadline).toEqual(deadline);
    expect(jobRepository.save).toHaveBeenCalledWith(job);
  });

  it('returns approved and rejected jobs to pending review after edits', async () => {
    for (const status of [JobStatus.APPROVED, JobStatus.REJECTED]) {
      const job = { status } as Job;
      jobRepository.findOne.mockResolvedValue(job);
      jobRepository.save.mockResolvedValue(job);

      await service.updateJob('job-id', { title: 'Updated title' }, 12);

      expect(job.status).toBe(JobStatus.PENDING);
      expect(jobRepository.save).toHaveBeenCalledWith(job);
    }
  });

  it('prevents editing or resubmitting an administratively removed job', async () => {
    jobRepository.findOne.mockResolvedValue({ status: JobStatus.REMOVED });

    await expect(
      service.updateJob('job-id', { title: 'Edited title' }, 12),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.publishJob('job-id', 12)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(jobRepository.save).not.toHaveBeenCalled();
  });

  it('removes a job from listings while preserving its record', async () => {
    const job = {
      title: 'Engineer',
      status: JobStatus.APPROVED,
      deadline: new Date('2099-07-15T23:59:59.000Z'),
    } as Job;
    jobRepository.findOne.mockResolvedValue(job);
    jobRepository.save.mockResolvedValue(job);

    await expect(service.deleteJob('job-id', 12)).resolves.toMatchObject({
      message: 'The job was closed and retained with its application history.',
      job,
    });
    expect(job.status).toBe(JobStatus.CLOSED);
    expect(jobRepository.remove).not.toHaveBeenCalled();
  });

  it('leaves a closed job unchanged when an employer removes it', async () => {
    const job = { title: 'Engineer', status: JobStatus.CLOSED } as Job;
    jobRepository.findOne.mockResolvedValue(job);

    await expect(service.deleteJob('job-id', 12)).resolves.toMatchObject({
      message: 'The job was closed and retained with its application history.',
      job,
    });
    expect(jobRepository.save).not.toHaveBeenCalled();
  });

  it('publishes an owned draft and rejects closed jobs', async () => {
    const job = {
      status: JobStatus.DRAFT,
      deadline: new Date('2099-07-15T23:59:59.000Z'),
      company: { verificationStatus: 'verified' },
    } as Job;
    jobRepository.findOne.mockResolvedValue(job);
    jobRepository.save.mockResolvedValue({ ...job, status: JobStatus.PENDING });

    await service.publishJob('job-id', 12);

    expect(job.status).toBe(JobStatus.PENDING);
    expect(jobRepository.save).toHaveBeenCalledWith(job);

    jobRepository.findOne.mockResolvedValue({ status: JobStatus.CLOSED });
    await expect(service.publishJob('job-id', 12)).rejects.toBeInstanceOf(
      BadRequestException,
    );

    jobRepository.findOne.mockResolvedValue({ status: JobStatus.APPROVED });
    await expect(service.publishJob('job-id', 12)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('closes a draft instead of publishing it after its deadline', async () => {
    const job = {
      status: JobStatus.DRAFT,
      deadline: new Date('2000-07-15T21:59:59.999Z'),
      company: { verificationStatus: 'verified' },
    } as Job;
    jobRepository.findOne.mockResolvedValue(job);
    jobRepository.save.mockResolvedValue(job);

    await expect(service.publishJob('job-id', 12)).rejects.toBeInstanceOf(
      BadRequestException,
    );

    expect(job.status).toBe(JobStatus.CLOSED);
    expect(jobRepository.save).toHaveBeenCalledWith(job);
  });

  it('closes an owned listing', async () => {
    const job = { status: JobStatus.APPROVED } as Job;
    jobRepository.findOne.mockResolvedValue(job);
    jobRepository.save.mockResolvedValue(job);

    await service.closeJob('job-id', 12);

    expect(job.status).toBe(JobStatus.CLOSED);
    expect(jobRepository.save).toHaveBeenCalledWith(job);
  });

  it('only allows approved jobs to be closed by employers', async () => {
    jobRepository.findOne.mockResolvedValue({ status: JobStatus.PENDING });

    await expect(service.closeJob('job-id', 12)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(jobRepository.save).not.toHaveBeenCalled();
  });

  it('lists pending jobs with the details needed for administrator review', async () => {
    jobRepository.find.mockResolvedValue([]);

    await service.getPendingJobsForReview();

    expect(jobRepository.find).toHaveBeenCalledWith({
      where: { status: JobStatus.PENDING },
      relations: {
        company: true,
        postedBy: true,
        applicationRequirements: true,
      },
      order: { createdAt: 'ASC' },
    });
  });

  it('allows administrators to approve and reject pending jobs', async () => {
    const approvedJob = {
      id: 'approve-id',
      status: JobStatus.PENDING,
      deadline: new Date('2099-07-15T23:59:59.000Z'),
      company: { verificationStatus: 'verified' },
    } as Job;
    const rejectedJob = {
      id: 'reject-id',
      status: JobStatus.PENDING,
      company: { verificationStatus: 'verified' },
    } as Job;
    jobRepository.findOne
      .mockResolvedValueOnce({ status: JobStatus.PENDING })
      .mockResolvedValueOnce(approvedJob)
      .mockResolvedValueOnce({ status: JobStatus.PENDING })
      .mockResolvedValueOnce(rejectedJob);
    jobRepository.save.mockImplementation((job) => Promise.resolve(job));

    await expect(service.approveJob('approve-id')).resolves.toBe(approvedJob);
    await expect(service.rejectJob('reject-id')).resolves.toBe(rejectedJob);

    expect(approvedJob.status).toBe(JobStatus.APPROVED);
    expect(rejectedJob.status).toBe(JobStatus.REJECTED);
    expect(jobRepository.manager.transaction).toHaveBeenCalledTimes(2);
  });

  it('prevents approving non-pending or expired jobs', async () => {
    jobRepository.findOne
      .mockResolvedValueOnce({ status: JobStatus.APPROVED })
      .mockResolvedValueOnce({ status: JobStatus.PENDING })
      .mockResolvedValueOnce({
        status: JobStatus.PENDING,
        deadline: new Date('2000-07-15T21:59:59.999Z'),
        company: { verificationStatus: 'verified' },
      });

    await expect(service.approveJob('approved-id')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(service.approveJob('expired-id')).rejects.toBeInstanceOf(
      BadRequestException,
    );

    expect(jobRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: JobStatus.CLOSED }),
    );
  });

  it('does not approve a job whose company is not verified', async () => {
    jobRepository.findOne
      .mockResolvedValueOnce({ status: JobStatus.PENDING })
      .mockResolvedValueOnce({
        status: JobStatus.PENDING,
        deadline: new Date('2099-07-15T23:59:59.000Z'),
        company: { verificationStatus: 'pending' },
      });

    await expect(service.approveJob('job-id')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(jobRepository.save).not.toHaveBeenCalled();
  });

  it('only returns approved jobs to job seekers by ID', async () => {
    jobRepository.findOne.mockResolvedValue(null);

    await expect(service.getOneJob('job-id')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(jobRepository.findOne).toHaveBeenCalledWith({
      where: {
        id: 'job-id',
        status: JobStatus.APPROVED,
        deadline: expect.objectContaining({ _type: 'moreThan' }),
        company: { verificationStatus: 'verified' },
      },
      relations: { company: true, applicationRequirements: true },
    });
  });

  it('closes approved jobs whose deadline has passed', async () => {
    await service.closeExpiredJobs();

    const [criteria, update] = jobRepository.update.mock.calls[0];
    expect(criteria).toHaveLength(2);
    expect(criteria[0].status).toBe(JobStatus.APPROVED);
    expect(criteria[0].deadline._type).toBe('lessThanOrEqual');
    expect(criteria[0].deadline._value).toBeInstanceOf(Date);
    expect(criteria[1].status).toBe(JobStatus.APPROVED);
    expect(criteria[1].deadline._type).toBe('isNull');
    expect(update).toEqual({ status: JobStatus.CLOSED });
  });
});
