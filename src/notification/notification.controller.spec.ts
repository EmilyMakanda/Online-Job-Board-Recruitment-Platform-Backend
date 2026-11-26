import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from '../email/email.service.js';
import { NotificationsController } from './notification.controller.js';
import { NotificationsService } from './notification.service.js';

describe('NotificationController', () => {
  let controller: NotificationsController;
  const notificationsService = {
    create: vi.fn(),
    findUnread: vi.fn(),
    findByUser: vi.fn(),
    markAsRead: vi.fn(),
  };
  const emailService = {
    sendTestEmail: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        { provide: NotificationsService, useValue: notificationsService },
        { provide: EmailService, useValue: emailService },
      ],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
