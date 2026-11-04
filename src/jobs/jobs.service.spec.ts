import { NotFoundException } from '@nestjs/common';
import type { Repository } from 'typeorm';
import { Job } from './entities/jobs.entity.js';
import { User } from '../authentication/entities/user.entity.js';
import { JobService } from './jobs.service.js';

describe('JobService', () => {
  const jobRepository = {
    find: vi.fn(),
    findOne: vi.fn(),
    createQueryBuilder: vi.fn(),
  };
  const userRepository = {};
  let service: JobService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new JobService(
      jobRepository as unknown as Repository<Job>,
      userRepository as unknown as Repository<User>,
    );
  });

  it('lists only jobs posted by the requested employer', async () => {
    const jobs = [{ id: 'job-id' }] as Job[];
    jobRepository.find.mockResolvedValue(jobs);

    await expect(service.getJobsByEmployer(12)).resolves.toBe(jobs);
    expect(jobRepository.find).toHaveBeenCalledWith({
      where: { postedBy: { id: 12 } },
      order: { createdAt: 'DESC' },
    });
  });

  it('does not return another employer listing by ID', async () => {
    jobRepository.findOne.mockResolvedValue(null);

    await expect(
      service.getOneJobForEmployer('job-id', 12),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(jobRepository.findOne).toHaveBeenCalledWith({
      where: { id: 'job-id', postedBy: { id: 12 } },
    });
  });

  it('searches job titles without regard to case', async () => {
    const jobs = [{ id: 'job-id' }] as Job[];
    const queryBuilder = {
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      getMany: vi.fn().mockResolvedValue(jobs),
    };
    jobRepository.createQueryBuilder.mockReturnValue(queryBuilder);

    await expect(service.searchJobsByName('Engineer')).resolves.toBe(jobs);
    expect(queryBuilder.where).toHaveBeenCalledWith(
      'LOWER(job.title) LIKE LOWER(:title)',
      { title: '%Engineer%' },
    );
    expect(queryBuilder.orderBy).toHaveBeenCalledWith('job.createdAt', 'DESC');
  });
});
