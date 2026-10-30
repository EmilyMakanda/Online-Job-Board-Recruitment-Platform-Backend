import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';

import { User } from '../authentication/entities/user.entity.js';
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

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: userRepo },
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
    it('returns all users', async () => {
      userRepo.find.mockResolvedValue([{ id: 1 }, { id: 2 }]);

      await expect(service.findAllUsers()).resolves.toHaveLength(2);
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

      await service.removeUser(1);

      expect(userRepo.remove).toHaveBeenCalledWith(user);
    });
  });
});