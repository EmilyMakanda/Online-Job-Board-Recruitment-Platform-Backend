import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';

import { User } from '../authentication/entities/user.entity.js';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';
import { Company } from '../company/entities/company.entity.js';
import { Application } from '../applications/entities/application.entity.js';
import { UsersService } from './users.service.js';
import { DataSource } from 'typeorm';

describe('UsersService', () => {
  let service: UsersService;

  const userRepo = {
    findOne: vi.fn(),
    findOneBy: vi.fn(),
    findOneByOrFail: vi.fn(),
    find: vi.fn(),
    findAndCount: vi.fn(),
    create: vi.fn(),
    save: vi.fn(),
    remove: vi.fn(),
  };
  const companyRepo = {
    findOneBy: vi.fn(),
    delete: vi.fn(),
  };
  const applicationRepo = { delete: vi.fn() };
  let documentQueryBuilder: {
    innerJoin: ReturnType<typeof vi.fn>;
    leftJoin: ReturnType<typeof vi.fn>;
    where: ReturnType<typeof vi.fn>;
    orWhere: ReturnType<typeof vi.fn>;
    select: ReturnType<typeof vi.fn>;
    getMany: ReturnType<typeof vi.fn>;
  };
  const documentRepo = {
    createQueryBuilder: vi.fn(),
  };
  const transactionManager = {
    getRepository: vi.fn((entity) => {
      if (entity === User) return userRepo;
      if (entity === Application) return applicationRepo;
      if (entity === Company) return companyRepo;
      return documentRepo;
    }),
  };
  const dataSource = {
    getRepository: vi.fn(() => documentRepo),
    transaction: vi.fn((work) => work(transactionManager)),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    documentQueryBuilder = {
      innerJoin: vi.fn(),
      leftJoin: vi.fn(),
      where: vi.fn(),
      orWhere: vi.fn(),
      select: vi.fn(),
      getMany: vi.fn().mockResolvedValue([]),
    };
    documentQueryBuilder.innerJoin.mockReturnValue(documentQueryBuilder);
    documentQueryBuilder.leftJoin.mockReturnValue(documentQueryBuilder);
    documentQueryBuilder.where.mockReturnValue(documentQueryBuilder);
    documentQueryBuilder.orWhere.mockReturnValue(documentQueryBuilder);
    documentQueryBuilder.select.mockReturnValue(documentQueryBuilder);
    documentRepo.createQueryBuilder.mockReturnValue(documentQueryBuilder);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: DataSource, useValue: dataSource },
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

  describe('findAllUsers', () => {
    it('returns only the requested page of users', async () => {
      userRepo.findAndCount.mockResolvedValue([[{ id: 1 }, { id: 2 }], 12]);
      const pagination = Object.assign(new PaginationQueryDto(), {
        page: 2,
        limit: 10,
      });

      await expect(service.findAllUsers(pagination)).resolves.toMatchObject({
        items: [{ id: 1 }, { id: 2 }],
        total: 12,
        page: 2,
        limit: 10,
        totalPages: 2,
      });
      expect(userRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 10 }),
      );
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
      const user = { id: 1 };
      userRepo.findOne.mockResolvedValue(user);
      companyRepo.findOneBy.mockResolvedValue(null);

      await service.removeUser(1);

      expect(dataSource.transaction).toHaveBeenCalledOnce();
      expect(applicationRepo.delete).toHaveBeenCalledWith({ jobSeekerId: 1 });
      expect(userRepo.remove).toHaveBeenCalledWith(user);
    });
  });

  describe('deactivateUser', () => {
    it('sets the account inactive and saves it', async () => {
      const user = { id: 4, isActive: 1 };
      userRepo.findOne.mockResolvedValue(user);
      userRepo.save.mockImplementation(async (savedUser) => savedUser);

      await expect(service.deactivateUser(4, 9)).resolves.toEqual({
        message: 'User with ID 4 deactivated successfully',
      });
      expect(user.isActive).toBe(0);
      expect(userRepo.save).toHaveBeenCalledWith(user);
    });

    it('throws NotFoundException for an unknown account', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.deactivateUser(404, 9)).rejects.toThrow(
        NotFoundException,
      );
      expect(userRepo.save).not.toHaveBeenCalled();
    });

    it('prevents an administrator from deactivating their own account', async () => {
      await expect(service.deactivateUser(4, 4)).rejects.toThrow(
        ForbiddenException,
      );
      expect(userRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('activateUser', () => {
    it('sets the account active and saves it', async () => {
      const user = { id: 4, isActive: 0 };
      userRepo.findOne.mockResolvedValue(user);
      userRepo.save.mockImplementation(async (savedUser) => savedUser);

      await expect(service.activateUser(4)).resolves.toEqual({
        message: 'User with ID 4 activated successfully',
      });
      expect(user.isActive).toBe(1);
      expect(userRepo.save).toHaveBeenCalledWith(user);
    });

    it('throws NotFoundException for an unknown account', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.activateUser(404)).rejects.toThrow(
        NotFoundException,
      );
      expect(userRepo.save).not.toHaveBeenCalled();
    });
  });
});
