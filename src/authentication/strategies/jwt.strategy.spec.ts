import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { User } from '../entities/user.entity.js';
import { JwtStrategy } from './jwt.strategy.js';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  const userRepository = {
    findOne: vi.fn(),
  };
  const configService = {
    getOrThrow: vi.fn().mockReturnValue('test-secret'),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: ConfigService, useValue: configService },
        { provide: getRepositoryToken(User), useValue: userRepository },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  it('returns the current active user identity from the database', async () => {
    userRepository.findOne.mockResolvedValue({
      id: 7,
      email: 'current@example.com',
      role: 'employer',
      isActive: 1,
    });

    await expect(
      strategy.validate({
        sub: 7,
        email: 'stale@example.com',
        role: 'job_seeker',
      }),
    ).resolves.toEqual({
      sub: 7,
      email: 'current@example.com',
      role: 'employer',
    });
    expect(userRepository.findOne).toHaveBeenCalledWith({
      where: { id: 7 },
      select: { id: true, email: true, role: true, isActive: true },
    });
  });

  it('rejects a user who no longer exists', async () => {
    userRepository.findOne.mockResolvedValue(null);

    await expect(
      strategy.validate({ sub: 7, email: 'old@example.com', role: 'job_seeker' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rejects a user whose account has been deactivated', async () => {
    userRepository.findOne.mockResolvedValue({
      id: 7,
      email: 'alex@example.com',
      role: 'job_seeker',
      isActive: 0,
    });

    await expect(
      strategy.validate({ sub: 7, email: 'alex@example.com', role: 'job_seeker' }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
