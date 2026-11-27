import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { vi } from 'vitest';

import { EmailService } from './email.service.js';

vi.mock('nodemailer', () => ({
  createTransport: vi.fn(),
}));

describe('EmailService', () => {
  let service: EmailService;
  const configValues: Record<string, string | undefined> = {
    SMTP_USER: 'mailer@example.com',
    SMTP_PASSWORD: 'smtp-password',
    SMTP_HOST: 'smtp.example.com',
    SMTP_PORT: '587',
    SMTP_SECURE: 'false',
    SMTP_FROM: 'noreply@example.com',
  };
  const configService = {
    get: vi.fn(
      (key: string, defaultValue?: string) => configValues[key] ?? defaultValue,
    ),
  };
  const sendMail = vi.fn();
  const close = vi.fn();

  beforeEach(async () => {
    vi.clearAllMocks();
    Object.assign(configValues, {
      SMTP_USER: 'mailer@example.com',
      SMTP_PASSWORD: 'smtp-password',
      SMTP_HOST: 'smtp.example.com',
      SMTP_PORT: '587',
      SMTP_SECURE: 'false',
      SMTP_FROM: 'noreply@example.com',
      SMTP_CLIENT_ID: undefined,
      SMTP_CLIENT_SECRET: undefined,
      SMTP_REFRESH_TOKEN: undefined,
    });
    sendMail.mockResolvedValue({ messageId: 'message-id' });
    vi.mocked(nodemailer.createTransport).mockReturnValue({
      sendMail,
      close,
    } as never);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
  });

  it('sends notification email through the configured SMTP server', async () => {
    await expect(
      service.sendNotificationEmail(
        'candidate@example.com',
        'Application received',
        'Your application was received.',
      ),
    ).resolves.toEqual({ messageId: 'message-id' });

    expect(nodemailer.createTransport).toHaveBeenCalledWith({
      host: 'smtp.example.com',
      port: 587,
      secure: false,
      auth: { user: 'mailer@example.com', pass: 'smtp-password' },
    });
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'noreply@example.com',
        to: 'candidate@example.com',
        subject: 'Application received',
        text: 'Your application was received.',
      }),
    );
    expect(close).toHaveBeenCalledOnce();
  });

  it('supports Gmail OAuth credentials when no SMTP password is configured', async () => {
    configValues.SMTP_PASSWORD = undefined;
    configValues.SMTP_CLIENT_ID = 'client-id';
    configValues.SMTP_CLIENT_SECRET = 'client-secret';
    configValues.SMTP_REFRESH_TOKEN = 'refresh-token';

    await service.sendNotificationEmail(
      'candidate@example.com',
      'Application received',
      'Your application was received.',
    );

    expect(nodemailer.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        auth: {
          type: 'OAuth2',
          user: 'mailer@example.com',
          clientId: 'client-id',
          clientSecret: 'client-secret',
          refreshToken: 'refresh-token',
        },
      }),
    );
  });
});
