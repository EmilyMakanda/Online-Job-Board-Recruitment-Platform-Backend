import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../authentication/entities/user.entity.js';
import { Company } from '../company/entities/company.entity.js';
import { Job } from '../jobs/entities/jobs.entity.js';
import { Application } from '../applications/entities/application.entity.js';
import { Report } from '../reports/entities/report.entity.js';
import { AdminService } from './admin.service.js';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';

describe('AdminService', () => {
  let service: AdminService;
  const userRepository = {
    find: vi.fn(),
    findOne: vi.fn(),
    save: vi.fn(),
    count: vi.fn(),
  };
  const companyRepository = {
    find: vi.fn(),
    findOneBy: vi.fn(),
    save: vi.fn(),
  };
  const jobRepository = {
    find: vi.fn(),
    findOne: vi.fn(),
    findOneBy: vi.fn(),
    save: vi.fn(),
    count: vi.fn(),
  };
  const applicationRepository = {
    find: vi.fn(),
    findOne: vi.fn(),
    count: vi.fn(),
  };
  const reportRepository = { find: vi.fn(), findOneBy: vi.fn(), save: vi.fn() };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: getRepositoryToken(User), useValue: userRepository },
        { provide: getRepositoryToken(Company), useValue: companyRepository },
        { provide: getRepositoryToken(Job), useValue: jobRepository },
        {
          provide: getRepositoryToken(Application),
          useValue: applicationRepository,
        },
        { provide: getRepositoryToken(Report), useValue: reportRepository },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('prevents an administrator from deactivating their own account', async () => {
    await expect(service.deactivateUser(3, 3)).rejects.toThrow(
      ForbiddenException,
    );
    expect(userRepository.findOne).not.toHaveBeenCalled();
  });

  it('selects only safe fields when listing user accounts', async () => {
    userRepository.find.mockResolvedValue([]);

    await service.getAllUsers();

    expect(userRepository.find).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.not.objectContaining({
          password: true,
          emailVerificationTokenHash: true,
          emailVerificationTokenExpiresAt: true,
        }),
      }),
    );
  });

  it('bounds every admin collection query using the requested page', async () => {
    const pagination = Object.assign(new PaginationQueryDto(), {
      page: 3,
      limit: 20,
    });
    userRepository.find.mockResolvedValue([]);
    companyRepository.find.mockResolvedValue([]);
    jobRepository.find.mockResolvedValue([]);
    applicationRepository.find.mockResolvedValue([]);
    reportRepository.find.mockResolvedValue([]);

    await service.getAllUsers(pagination);
    await service.getAllEmployers(pagination);
    await service.getAllCompanies(pagination);
    await service.getPendingCompanies(pagination);
    await service.getAllJobs(pagination);
    await service.getAllApplications(pagination);
    await service.getAllReports(pagination);

    for (const [options] of userRepository.find.mock.calls) {
      expect(options).toMatchObject({ skip: 40, take: 20 });
    }
    for (const [options] of companyRepository.find.mock.calls) {
      expect(options).toMatchObject({ skip: 40, take: 20 });
    }
    for (const [options] of jobRepository.find.mock.calls) {
      expect(options).toMatchObject({ skip: 40, take: 20 });
    }
    expect(applicationRepository.find).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 40, take: 20 }),
    );
    expect(reportRepository.find).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 40, take: 20 }),
    );
  });

  it('returns counts for every requested system statistic', async () => {
    const counts = [10, 5, 3, 2, 8, 2, 4, 1, 13];
    userRepository.count.mockImplementation(async () => counts.shift());
    jobRepository.count.mockImplementation(async () => counts.shift());
    applicationRepository.count.mockImplementation(async () => counts.shift());

    await expect(service.getStatistics()).resolves.toEqual({
      totalUsers: 10,
      totalJobSeekers: 5,
      totalEmployers: 3,
      totalAdministrators: 2,
      totalJobs: 8,
      approvedJobs: 2,
      pendingJobs: 4,
      rejectedJobs: 1,
      totalApplications: 13,
    });
  });

  it('removes jobs from public listings without deleting their history', async () => {
    const job = { id: 'job-id', status: 'APPROVED' };
    jobRepository.findOneBy.mockResolvedValue(job);
    jobRepository.save.mockResolvedValue(job);

    await expect(service.removeJob('job-id')).resolves.toMatchObject({
      message: 'Job posting removed from public listings.',
      job: { status: 'REMOVED' },
    });
    expect(jobRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'REMOVED' }),
    );
  });

  it('returns application details with related job data', async () => {
    const application = { applicationId: 7, job: { id: 'job-id' } };
    applicationRepository.findOne.mockResolvedValue(application);

    await expect(service.getApplicationById(7)).resolves.toBe(application);
    expect(applicationRepository.findOne).toHaveBeenCalledWith({
      where: { applicationId: 7 },
      relations: { job: { company: true } },
    });
  });

  it('returns not found when the requested application does not exist', async () => {
    applicationRepository.findOne.mockResolvedValue(null);

    await expect(service.getApplicationById(404)).rejects.toThrow(
      'Application with ID 404 was not found',
    );
  });
});
