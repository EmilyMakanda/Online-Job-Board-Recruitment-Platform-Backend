import 'reflect-metadata';
import { vi } from 'vitest';
import { ROLES_KEY } from '../authentication/roles.decorator.js';
import { SearchJobsQueryDto } from './dto/search-jobs-query.dto.js';
import { JobService } from './jobs.service.js';
import { JobController } from './jobs.controller.js';

describe('JobController job creation access', () => {
  it('restricts job creation to verified-role employers', () => {
    expect(
      Reflect.getMetadata(
        ROLES_KEY,
        JobController.prototype.createJob,
      ),
    ).toEqual(['employer']);
  });
});

describe('JobController job search', () => {
  it('passes the q search term to the service', async () => {
    const jobService = {
      searchJobs: vi.fn().mockResolvedValue({ items: [], total: 0 }),
    };
    const controller = new JobController(jobService as unknown as JobService);
    const query = Object.assign(new SearchJobsQueryDto(), {
      q: 'engineer',
    });

    await controller.searchJobs(query);

    expect(jobService.searchJobs).toHaveBeenCalledWith(
      'engineer',
      undefined,
      query,
    );
  });

  it('passes the optional location filter with the q search term', async () => {
    const jobService = {
      searchJobs: vi.fn().mockResolvedValue({ items: [], total: 0 }),
    };
    const controller = new JobController(jobService as unknown as JobService);
    const query = Object.assign(new SearchJobsQueryDto(), {
      q: '  engineer  ',
      location: 'Lilongwe',
    });

    await controller.searchJobs(query);

    expect(jobService.searchJobs).toHaveBeenCalledWith(
      '  engineer  ',
      'Lilongwe',
      query,
    );
  });
});

describe('JobController application fields', () => {
  it('returns the job-specific fields from the service', async () => {
    const result = {
      jobId: 'job-id',
      fields: [
        {
          fieldKey: 'cv',
          fieldLabel: 'CV / Resume',
          isRequired: true,
        },
      ],
    };
    const jobService = {
      getApplicationFieldsForJob: vi.fn().mockResolvedValue(result),
    };
    const controller = new JobController(jobService as unknown as JobService);

    await expect(
      controller.getApplicationFieldsForJob('job-id'),
    ).resolves.toBe(result);
    expect(jobService.getApplicationFieldsForJob).toHaveBeenCalledWith(
      'job-id',
    );
  });
});
