import { ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import type { DataSource, EntityManager } from 'typeorm';
import { User } from '../../authentication/entities/user.entity.js';
import { seedAdmin } from './admin.seed.js';

describe('seedAdmin', () => {
  const createdUsers: Partial<User>[] = [];
  const userRepository = {
    findOne: vi.fn(),
    create: vi.fn((user: Partial<User>) => {
      createdUsers.push(user);
      return user;
    }),
    save: vi.fn(async (user: Partial<User>) => ({ ...user, id: 42 }) as User),
  };
  const manager = {
    getRepository: vi.fn(() => userRepository),
  } as unknown as EntityManager;
  const transaction = vi.fn(
    (callback: (manager: EntityManager) => Promise<unknown>) =>
      callback(manager),
  );
  const dataSource = {
    isInitialized: true,
    transaction,
  } as unknown as DataSource;

  beforeEach(() => {
    vi.clearAllMocks();
    createdUsers.length = 0;
  });

  it('does nothing when an active, verified administrator already exists', async () => {
    userRepository.findOne.mockResolvedValueOnce({
      id: 7,
      isActive: 1,
      isEmailVerified: 1,
    });

    await expect(seedAdmin(dataSource, {})).resolves.toEqual({
      status: 'already-exists',
      userId: 7,
    });
    expect(userRepository.create).not.toHaveBeenCalled();
    expect(userRepository.save).not.toHaveBeenCalled();
  });

  it('creates a verified admin with a bcrypt-hashed password', async () => {
    userRepository.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    const password = 'use-a-unique-secret-123';

    await expect(
      seedAdmin(dataSource, {
        name: ' System Administrator ',
        email: ' ADMIN@example.com ',
        password,
      }),
    ).resolves.toEqual({ status: 'created', userId: 42 });

    const savedUser = createdUsers[0];
    expect(savedUser).toMatchObject({
      name: 'System Administrator',
      email: 'admin@example.com',
      role: 'admin',
      isEmailVerified: 1,
      isActive: 1,
    });
    const storedPassword = savedUser.password;
    expect(storedPassword).not.toBe(password);
    expect(typeof storedPassword).toBe('string');
    if (typeof storedPassword !== 'string') {
      throw new Error('The seed did not create a password hash.');
    }
    expect(await bcrypt.compare(password, storedPassword)).toBe(true);
  });

  it('does not promote or overwrite an existing non-admin account', async () => {
    userRepository.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce({
      id: 11,
    });

    await expect(
      seedAdmin(dataSource, {
        email: 'user@example.com',
        password: 'use-a-unique-secret-123',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(userRepository.save).not.toHaveBeenCalled();
  });
});
