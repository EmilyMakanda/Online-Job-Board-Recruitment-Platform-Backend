import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import nodemailer from 'nodemailer';
import { AuthenticationService } from './authentication.service.js';
import { User } from './entities/user.entity.js';

vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn(),
  },
}));

describe('AuthenticationService', () => {
  let service: AuthenticationService;
  const userRepository = {
    findOne: vi.fn(),
    save: vi.fn(),
  };
  const configValues: Record<string, string> = {
    SMTP_USER: 'mailer@example.com',
    SMTP_PASSWORD: 'smtp-password',
    SMTP_HOST: 'smtp.example.com',
    SMTP_PORT: '587',
    SMTP_SECURE: 'false',
    SMTP_FROM: 'noreply@example.com',
  };
  const configService = {
    get: vi.fn((key: string) => configValues[key]),
  };
  const jwtService = {
    signAsync: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    configService.get.mockImplementation((key: string) => configValues[key]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthenticationService,
        { provide: getRepositoryToken(User), useValue: userRepository },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<AuthenticationService>(AuthenticationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('resends a fresh verification code through the configured SMTP server', async () => {
    const user = {
      email: 'candidate@example.com',
      isEmailVerified: 0,
      emailVerificationTokenHash: null,
      emailVerificationTokenExpiresAt: null,
    };
    const sendMail = vi.fn().mockResolvedValue({});
    const close = vi.fn();
    userRepository.findOne.mockResolvedValue(user);
    userRepository.save.mockImplementation(async (savedUser) => savedUser);
    vi.mocked(nodemailer.createTransport).mockReturnValue({
      sendMail,
      close,
    } as never);

    const result = await service.resendVerification(' Candidate@Example.com ');

    expect(userRepository.findOne).toHaveBeenCalledWith({
      where: { email: 'candidate@example.com' },
    });
    expect(userRepository.save).toHaveBeenCalledWith(user);
    expect(user.emailVerificationTokenHash).toMatch(/^[a-f\d]{64}$/);
    expect(user.emailVerificationTokenExpiresAt.getTime()).toBeGreaterThan(
      Date.now(),
    );
    expect(nodemailer.createTransport).toHaveBeenCalledWith({
      host: 'smtp.example.com',
      port: 587,
      secure: false,
      auth: { user: 'mailer@example.com', pass: 'smtp-password' },
    });
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'candidate@example.com' }),
    );
    expect(close).toHaveBeenCalled();
    expect(result).toEqual({
      message: 'A new six-digit verification code has been sent to your email.',
      emailSent: true,
    });
  });
});
