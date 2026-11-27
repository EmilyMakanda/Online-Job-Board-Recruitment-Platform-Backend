import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { validate } from 'class-validator';
import { EmailService } from '../email/email.service.js';
import { AuthenticationService } from './authentication.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { User } from './entities/user.entity.js';

describe('AuthenticationService', () => {
  let service: AuthenticationService;
  const userRepository = {
    findOne: vi.fn(),
    create: vi.fn((user) => user),
    save: vi.fn(),
    createQueryBuilder: vi.fn(),
  };
  const queryBuilder = {
    addSelect: vi.fn(),
    where: vi.fn(),
    getOne: vi.fn(),
  };
  const jwtService = {
    signAsync: vi.fn(),
  };
  const emailService = {
    sendEmail: vi.fn().mockResolvedValue({ messageId: 'message-id' }),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    emailService.sendEmail.mockResolvedValue({ messageId: 'message-id' });
    queryBuilder.addSelect.mockReturnValue(queryBuilder);
    queryBuilder.where.mockReturnValue(queryBuilder);
    userRepository.createQueryBuilder.mockReturnValue(queryBuilder);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthenticationService,
        { provide: getRepositoryToken(User), useValue: userRepository },
        { provide: JwtService, useValue: jwtService },
        { provide: EmailService, useValue: emailService },
      ],
    }).compile();

    service = module.get<AuthenticationService>(AuthenticationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('registers public accounts as active unverified job seekers', async () => {
    userRepository.findOne.mockResolvedValue(null);
    userRepository.save.mockImplementation(async (user) => ({
      id: 1,
      ...user,
    }));

    await service.register({
      name: 'Alex Smith',
      email: 'alex@example.com',
      password: 'StrongPass123!',
    });

    expect(userRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        role: 'job_seeker',
        isEmailVerified: 0,
        isActive: 1,
      }),
    );
  });

  it('assigns employer role only through the dedicated employer registration flow', async () => {
    userRepository.findOne.mockResolvedValue(null);
    userRepository.save.mockImplementation(async (user) => ({
      id: 2,
      ...user,
    }));

    await service.registerEmployer({
      name: 'Morgan Employer',
      email: 'morgan@example.com',
      password: 'StrongPass123!',
    });

    expect(userRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'employer' }),
    );
  });

  it('rejects role assignment in the public registration DTO', async () => {
    const dto = Object.assign(new RegisterDto(), {
      name: 'Taylor Admin',
      email: 'admin@example.com',
      password: 'StrongPass123!',
      role: 'admin',
    });

    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          property: 'role',
          constraints: expect.objectContaining({
            whitelistValidation: expect.any(String),
          }),
        }),
      ]),
    );
  });

  it('verifies OTPs through the explicitly selected expiry field and clears both tokens', async () => {
    const user = {
      isEmailVerified: 0,
      emailVerificationTokenHash: 'stored-hash',
      emailVerificationTokenExpiresAt: new Date(Date.now() + 60_000),
    };
    queryBuilder.getOne.mockResolvedValue(user);
    userRepository.save.mockImplementation(async (savedUser) => savedUser);

    await expect(service.verifyEmail('123456')).resolves.toEqual({
      message: 'Email verified successfully. You can now log in.',
    });

    expect(queryBuilder.addSelect).toHaveBeenCalledWith(
      'user.emailVerificationTokenExpiresAt',
    );
    expect(user.isEmailVerified).toBe(1);
    expect(user.emailVerificationTokenHash).toBeNull();
    expect(user.emailVerificationTokenExpiresAt).toBeNull();
  });

  describe('login', () => {
    it('issues a JWT for an active, verified user with the existing identity payload', async () => {
      const passwordHash = await bcrypt.hash('StrongPass123!', 4);
      queryBuilder.getOne.mockResolvedValue({
        id: 7,
        email: 'alex@example.com',
        role: 'job_seeker',
        password: passwordHash,
        isEmailVerified: 1,
        isActive: 1,
      });
      jwtService.signAsync.mockResolvedValue('signed-token');

      const result = await service.login({
        email: 'alex@example.com',
        password: 'StrongPass123!',
      });

      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: 7,
        email: 'alex@example.com',
        role: 'job_seeker',
      });
      expect(result.access_token).toBe('signed-token');
    });

    it('rejects an inactive user without issuing a JWT', async () => {
      const passwordHash = await bcrypt.hash('StrongPass123!', 4);
      queryBuilder.getOne.mockResolvedValue({
        id: 7,
        email: 'alex@example.com',
        role: 'job_seeker',
        password: passwordHash,
        isEmailVerified: 1,
        isActive: 0,
      });

      await expect(
        service.login({
          email: 'alex@example.com',
          password: 'StrongPass123!',
        }),
      ).rejects.toThrow(
        'Your account has been deactivated. Please contact the administrator.',
      );
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });

    it('authenticates administrator accounts using the stored role', async () => {
      const passwordHash = await bcrypt.hash('StrongPass123!', 4);
      queryBuilder.getOne.mockResolvedValue({
        id: 8,
        name: 'Admin',
        email: 'admin@example.com',
        role: 'admin',
        password: passwordHash,
        isEmailVerified: 1,
        isActive: 1,
      });
      jwtService.signAsync.mockResolvedValue('admin-token');

      const result = await service.login({
        email: 'admin@example.com',
        password: 'StrongPass123!',
      });

      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: 8,
        email: 'admin@example.com',
        role: 'admin',
      });
      expect(result.user.role).toBe('admin');
    });
  });

  it('resends a fresh verification code through the configured SMTP server', async () => {
    const user = {
      email: 'candidate@example.com',
      isEmailVerified: 0,
      emailVerificationTokenHash: null,
      emailVerificationTokenExpiresAt: null,
    };
    userRepository.findOne.mockResolvedValue(user);
    userRepository.save.mockImplementation(async (savedUser) => savedUser);
    emailService.sendEmail.mockResolvedValue({ messageId: 'message-id' });

    const result = await service.resendVerification(' Candidate@Example.com ');

    expect(userRepository.findOne).toHaveBeenCalledWith({
      where: { email: 'candidate@example.com' },
    });
    expect(userRepository.save).toHaveBeenCalledWith(user);
    expect(user.emailVerificationTokenHash).toMatch(/^[a-f\d]{64}$/);
    expect(
      new Date(String(user.emailVerificationTokenExpiresAt)).getTime(),
    ).toBeGreaterThan(Date.now());
    expect(emailService.sendEmail).toHaveBeenCalledWith(
      'candidate@example.com',
      'Your Job Board Verification Code',
      expect.stringContaining('Your six-digit verification code is:'),
      expect.stringContaining('<h1 style="letter-spacing: 8px;">'),
    );
    expect(result).toEqual({
      message: 'A new six-digit verification code has been sent to your email.',
      emailSent: true,
    });
  });
});
