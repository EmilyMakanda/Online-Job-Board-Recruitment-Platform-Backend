import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { vi } from 'vitest';
import { EmailService } from '../email/email.service.js';
import { ROLES_KEY } from '../authentication/roles.decorator.js';
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard.js';
import { RolesGuard } from '../authentication/guards/roles.guards.js';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';
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

  it('requires authentication and admin privileges for notification creation', () => {
    expect(Reflect.getMetadata('__guards__', NotificationsController)).toEqual([
      JwtAuthGuard,
      RolesGuard,
    ]);
    expect(
      Reflect.getMetadata(ROLES_KEY, NotificationsController.prototype.create),
    ).toEqual(['admin']);
  });

  it('limits notification reads to the authenticated user', () => {
    expect(() =>
      controller.findByUser(
        8,
        new PaginationQueryDto(),
        { user: { sub: 7, role: 'job_seeker' } } as never,
      ),
    ).toThrow(ForbiddenException);
  });

  it('allows the authenticated user to read their own notifications', () => {
    controller.findByUser(
      7,
      new PaginationQueryDto(),
      { user: { sub: 7, role: 'job_seeker' } } as never,
    );
    expect(notificationsService.findByUser).toHaveBeenCalledWith(
      7,
      expect.any(PaginationQueryDto),
    );
  });
});
