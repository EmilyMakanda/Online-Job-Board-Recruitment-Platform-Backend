import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { vi } from 'vitest';

import { EmailService } from '../email/email.service.js';
import { Notification } from './notification.entity.js';
import { NotificationsService } from './notification.service.js';

describe('NotificationService', () => {
  let service: NotificationsService;
  const notificationRepository = {
    create: vi.fn((notification) => notification),
    save: vi.fn(),
    find: vi.fn(),
    findOneBy: vi.fn(),
  };
  const emailService = {
    sendNotificationEmail: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: getRepositoryToken(Notification),
          useValue: notificationRepository,
        },
        { provide: EmailService, useValue: emailService },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('saves an in-app notification and sends its email with the supplied subject', async () => {
    const savedNotification = { ID: 12, userId: 7, message: 'Shortlisted' };
    notificationRepository.save.mockResolvedValue(savedNotification);
    emailService.sendNotificationEmail.mockResolvedValue({
      messageId: 'message-id',
    });

    await expect(
      service.create({
        userId: 7,
        email: 'candidate@example.com',
        subject: 'You have been shortlisted',
        message: 'Congratulations, you have been shortlisted.',
      }),
    ).resolves.toMatchObject({
      notification: savedNotification,
      emailStatus: 'accepted',
      messageId: 'message-id',
    });

    expect(notificationRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 7,
        email: 'candidate@example.com',
        message: 'Congratulations, you have been shortlisted.',
        isRead: 0,
      }),
    );
    expect(emailService.sendNotificationEmail).toHaveBeenCalledWith(
      'candidate@example.com',
      'You have been shortlisted',
      'Congratulations, you have been shortlisted.',
    );
  });

  it('keeps the in-app notification when email delivery fails', async () => {
    notificationRepository.save.mockResolvedValue({ ID: 13 });
    emailService.sendNotificationEmail.mockRejectedValue(
      new Error('SMTP unavailable'),
    );

    await expect(
      service.create({
        userId: 7,
        email: 'candidate@example.com',
        message: 'Your application was received.',
      }),
    ).resolves.toMatchObject({
      notification: { ID: 13 },
      emailStatus: 'failed',
    });

    expect(notificationRepository.save).toHaveBeenCalledOnce();
  });
});
