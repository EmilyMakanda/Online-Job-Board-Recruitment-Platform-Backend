import { getRepositoryToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';

import { User } from '../authentication/entities/user.entity.js';
import { AdminAuditService } from '../admin/admin-audit.service.js';
import { Job, JobStatus } from '../jobs/entities/jobs.entity.js';
import { Company } from './entities/company.entity.js';
import { CompanyService } from './company.service.js';

describe('CompanyService admin verification', () => {
  const companyRepository = {
    findOne: vi.fn(),
    save: vi.fn(),
  };
  const userRepository = {};
  const jobRepository = {
    find: vi.fn(),
    save: vi.fn(),
  };
  const auditService = { write: vi.fn() };
  const manager = {
    getRepository: vi.fn((entity: Function) =>
      entity === Company ? companyRepository : jobRepository,
    ),
  };
  const transaction = vi.fn(
    (callback: (manager: typeof manager) => Promise<unknown>) =>
      callback(manager),
  );
  companyRepository.manager = { transaction };
  let service: CompanyService;

  beforeEach(async () => {
    vi.clearAllMocks();
    companyRepository.findOne.mockResolvedValue({
      companyId: 4,
      verificationStatus: 'verified',
      verifiedAt: new Date(),
    });
    companyRepository.save.mockImplementation(async (company) => company);
    jobRepository.find.mockResolvedValue([{ id: 'job-id' }]);
    jobRepository.save.mockImplementation(async (jobs) => jobs);
    auditService.write.mockResolvedValue({});

    const module = await Test.createTestingModule({
      providers: [
        CompanyService,
        { provide: getRepositoryToken(Company), useValue: companyRepository },
        { provide: getRepositoryToken(User), useValue: userRepository },
        { provide: getRepositoryToken(Job), useValue: jobRepository },
        { provide: AdminAuditService, useValue: auditService },
      ],
    }).compile();
    service = module.get(CompanyService);
  });

  it('rejects a company and its approved jobs atomically with an audit record', async () => {
    const result = await service.updateAdminVerification(
      4,
      11,
      { verificationStatus: 'rejected' },
    );

    expect(result.company).toMatchObject({
      companyId: 4,
      verificationStatus: 'rejected',
      verifiedAt: null,
    });
    expect(jobRepository.save).toHaveBeenCalledWith([
      { id: 'job-id', status: JobStatus.REJECTED },
    ]);
    expect(auditService.write).toHaveBeenCalledWith(
      manager,
      expect.objectContaining({
        actorId: 11,
        action: 'company.verification.update',
        targetId: '4',
        details: expect.objectContaining({
          from: 'verified',
          to: 'rejected',
        }),
      }),
    );
  });
});
