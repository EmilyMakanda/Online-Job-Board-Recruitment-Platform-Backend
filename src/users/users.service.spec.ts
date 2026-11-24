import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';

import { User } from '../authentication/entities/user.entity.js';
import { Company } from '../company/entities/company.entity.js';
import { AdminAuditService } from '../admin/admin-audit.service.js';
import { UsersService } from './users.service.js';

describe('UsersService', () => {
  let service: UsersService;

  const userRepo = {
    findOne: vi.fn(),
    findOneBy: vi.fn(),
    findOneByOrFail: vi.fn(),
    find: vi.fn(),
    create: vi.fn(),
    save: vi.fn(),
    remove: vi.fn(),
  };
  const companyRepo = {
    find: vi.fn(),
    findOneBy: vi.fn(),
  };
  const adminAuditService = { write: vi.fn() };
  const transactionUserRepo = {
    findOne: vi.fn(),
    find: vi.fn(),
    save: vi.fn(),
  };
  const transactionManager = {
    getRepository: vi.fn(() => transactionUserRepo),
  };
  userRepo.manager = {
    transaction: vi.fn((callback) => callback(transactionManager)),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    transactionUserRepo.findOne.mockResolvedValue(null);
    transactionUserRepo.find.mockResolvedValue([]);
    transactionUserRepo.save.mockImplementation(async (user) => user);
    adminAuditService.write.mockResolvedValue({});

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: getRepositoryToken(Company), useValue: companyRepo },
        { provide: AdminAuditService, useValue: adminAuditService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createUser', () => {
    const dto = {
      name: 'Alex Smith',
      email: 'alex@example.com',
      password: 'StrongPass123!',
    };

    it('creates a job seeker with a hashed password', async () => {
      userRepo.findOne.mockResolvedValue(null);
      userRepo.create.mockImplementation((user) => user);
      userRepo.save.mockImplementation(async (user) => ({ id: 1, ...user }));
      userRepo.findOneByOrFail.mockResolvedValue({ id: 1 });

      await service.createUser(dto);

      const created = userRepo.create.mock.calls[0][0];
      expect(created.email).toBe('alex@example.com');
      expect(created.role).toBe('job_seeker');
      expect(created.password).not.toBe(dto.password);
      expect(userRepo.findOneByOrFail).toHaveBeenCalledWith({ id: 1 });
    });

    it('rejects a duplicate email', async () => {
      userRepo.findOne.mockResolvedValue({ id: 9 });

      await expect(service.createUser(dto)).rejects.toThrow(ConflictException);
      expect(userRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('findUser', () => {
    it('returns the user when found', async () => {
      userRepo.findOne.mockResolvedValue({ id: 1 });

      await expect(service.findUser(1)).resolves.toEqual({ id: 1 });
    });

    it('throws NotFoundException when missing', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.findUser(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateUser', () => {
    it('updates profile fields and saves', async () => {
      userRepo.findOne.mockResolvedValue({ id: 1, name: 'Old' });
      userRepo.save.mockImplementation(async (user) => user);

      const result = await service.updateUser(1, {
        name: 'New',
        location: 'Lilongwe',
      });

      expect(result.name).toBe('New');
      expect(result.location).toBe('Lilongwe');
      expect(userRepo.save).toHaveBeenCalled();
    });

    it('throws NotFoundException for a missing user', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.updateUser(99, { name: 'X' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('removeUser', () => {
    it('removes an existing user', async () => {
      const user = { id: 1, role: 'job_seeker' };
      userRepo.findOne.mockResolvedValue(user);

      await service.removeUser(1);

      expect(userRepo.remove).toHaveBeenCalledWith(user);
    });

    it('prevents self-service deletion of administrator accounts', async () => {
      userRepo.findOne.mockResolvedValue({ id: 1, role: 'admin' });

      await expect(service.removeUser(1)).rejects.toThrow(ForbiddenException);
      expect(userRepo.remove).not.toHaveBeenCalled();
    });

    describe('admin role operations', () => {
      it('prevents an administrator from deactivating their own account', async () => {
        await expect(
          service.updateAdminUserStatus(3, 3, { isActive: 0 }),
        ).rejects.toThrow(ForbiddenException);
        expect(userRepo.manager.transaction).not.toHaveBeenCalled();
      });

      it('prevents deactivating the last active administrator', async () => {
        transactionUserRepo.findOne.mockResolvedValue({
          id: 3,
          role: 'admin',
          isActive: 1,
        });
        transactionUserRepo.find.mockResolvedValue([{ id: 3 }]);

        await expect(
          service.updateAdminUserStatus(3, 11, { isActive: 0 }),
        ).rejects.toThrow(ConflictException);
        expect(transactionUserRepo.save).not.toHaveBeenCalled();
        expect(adminAuditService.write).not.toHaveBeenCalled();
      });

      it('updates account status and writes the audit record in the transaction', async () => {
        transactionUserRepo.findOne.mockResolvedValue({
          id: 12,
          role: 'employer',
          isActive: 1,
        });
        userRepo.findOne.mockResolvedValue({
          id: 12,
          role: 'employer',
          isActive: 0,
        });

        await expect(
          service.updateAdminUserStatus(12, 11, { isActive: 0 }),
        ).resolves.toMatchObject({
          message: 'User account deactivated successfully.',
          user: { id: 12, isActive: 0 },
        });
        expect(adminAuditService.write).toHaveBeenCalledWith(
          transactionManager,
          expect.objectContaining({
            actorId: 11,
            action: 'user.deactivate',
            targetType: 'user',
            targetId: '12',
            details: { from: 1, to: 0 },
          }),
        );
      });
    });
  });
});
