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
    remove: vi.fn(),
    createQueryBuilder: vi.fn(),
  };
  const userRepository = { findOne: vi.fn() };
  const companyRepository = { findOneBy: vi.fn() };
  let service: JobService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new JobService(
      jobRepository as unknown as Repository<Job>,
      userRepository as unknown as Repository<User>,
      companyRepository as unknown as Repository<Company>,
    );
  });

  it('creates a draft associated with the authenticated employer company', async () => {
    const user = { id: 12 } as User;
    const company = { companyId: 3, employerId: 12 } as Company;
    const job = { id: 'job-id', status: JobStatus.DRAFT } as Job;
    userRepository.findOne.mockResolvedValue(user);
    companyRepository.findOneBy.mockResolvedValue(company);
    jobRepository.create.mockReturnValue(job);
    jobRepository.save.mockResolvedValue(job);

    await expect(
      service.createJob(
        { title: 'Engineer', description: 'Build software', location: 'Remote' },
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
      status: JobStatus.DRAFT,
      postedBy: user,
      company,
    });
  });

  it('does not allow an employer without a company to create a job', async () => {
    userRepository.findOne.mockResolvedValue({ id: 12 });
    companyRepository.findOneBy.mockResolvedValue(null);

    await expect(
      service.createJob(
        { title: 'Engineer', description: 'Build software', location: 'Remote' },
        12,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(jobRepository.save).not.toHaveBeenCalled();
  });

  it('lists jobs associated with the requested employer company', async () => {
    const jobs = [{ id: 'job-id' }] as Job[];
    jobRepository.find.mockResolvedValue(jobs);

    await expect(service.getJobsByEmployer(12)).resolves.toBe(jobs);
    expect(jobRepository.find).toHaveBeenCalledWith({
      where: { company: { employerId: 12 } },
      relations: { company: true },
      order: { createdAt: 'DESC' },
    });
  });

  it('lists only open jobs to job seekers', async () => {
    jobRepository.find.mockResolvedValue([]);

    await service.getAllJobs();

    expect(jobRepository.find).toHaveBeenCalledWith({
      where: { status: JobStatus.OPEN },
      relations: { company: true },
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
      relations: { company: true },
    });
  });

  it('searches open jobs by title, description, or location without regard to case', async () => {
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
    expect(queryBuilder.where).toHaveBeenCalledWith('job.status = :status', {
      status: JobStatus.OPEN,
    });
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      '(LOWER(job.title) LIKE LOWER(:term) OR LOWER(job.description) LIKE LOWER(:term) OR LOWER(job.location) LIKE LOWER(:term))',
      { term: '%Engineer%' },
    );
    expect(queryBuilder.orderBy).toHaveBeenCalledWith('job.createdAt', 'DESC');
  });

  it('requires a non-empty search query', async () => {
    expect(() => service.searchJobsByName('   ')).toThrow(
      BadRequestException,
    );
  });

  it('updates only a job associated with the employer company', async () => {
    const job = { title: 'Old title' } as Job;
    jobRepository.findOne.mockResolvedValue(job);
    jobRepository.save.mockResolvedValue({ ...job, title: 'New title' });

    await service.updateJob('job-id', { title: 'New title' }, 12);

    expect(jobRepository.findOne).toHaveBeenCalledWith({
      where: { id: 'job-id', company: { employerId: 12 } },
      relations: { company: true },
    });
    expect(job.title).toBe('New title');
    expect(jobRepository.save).toHaveBeenCalledWith(job);
  });

  it('deletes only a job associated with the employer company', async () => {
    jobRepository.findOne.mockResolvedValue({ title: 'Engineer' });
    jobRepository.remove.mockResolvedValue(undefined);

    await expect(service.deleteJob('job-id', 12)).resolves.toEqual({
      message: 'Job "Engineer" successfully deleted',
    });
    expect(jobRepository.remove).toHaveBeenCalledWith({ title: 'Engineer' });
  });

  it('publishes an owned draft and rejects closed jobs', async () => {
    const job = { status: JobStatus.DRAFT } as Job;
    jobRepository.findOne.mockResolvedValue(job);
    jobRepository.save.mockResolvedValue({ ...job, status: JobStatus.OPEN });

    await service.publishJob('job-id', 12);

    expect(job.status).toBe(JobStatus.OPEN);
    expect(jobRepository.save).toHaveBeenCalledWith(job);

    jobRepository.findOne.mockResolvedValue({ status: JobStatus.CLOSED });
    await expect(
      service.publishJob('job-id', 12),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('closes an owned listing', async () => {
    const job = { status: JobStatus.OPEN } as Job;
    jobRepository.findOne.mockResolvedValue(job);
    jobRepository.save.mockResolvedValue(job);

    await service.closeJob('job-id', 12);

    expect(job.status).toBe(JobStatus.CLOSED);
    expect(jobRepository.save).toHaveBeenCalledWith(job);
  });

  it('only returns open jobs to job seekers by ID', async () => {
    jobRepository.findOne.mockResolvedValue(null);

    await expect(service.getOneJob('job-id')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(jobRepository.findOne).toHaveBeenCalledWith({
      where: { id: 'job-id', status: JobStatus.OPEN },
      relations: { company: true },
    });
  });
});
