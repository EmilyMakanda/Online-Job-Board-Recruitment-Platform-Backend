import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Notification } from './notification.entity.js';
import { CreateNotificationDto } from './create-notification.dto.js';
import { EmailService } from '../email/email.service.js';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';
import { paginated, paginationOptions } from '../common/pagination.js';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,

    private readonly emailService: EmailService,
  ) {}

  async create(dto: CreateNotificationDto) {
    // Save notification in Oracle.
    const notification = this.notificationRepository.create({
      userId: dto.userId,
      message: dto.message,
      email: dto.email,
      isRead: 0,
    });

    const savedNotification =
      await this.notificationRepository.save(notification);

    // Send email to the supplied recipient.
    try {
      const emailResult = await this.emailService.sendNotificationEmail(
        dto.email,
        dto.subject ?? 'Job Board Notification',
        dto.message,
      );

      return {
        notification: savedNotification,
        emailStatus: 'accepted',
        messageId: emailResult?.messageId,
      };
    } catch (error) {
      this.logger.error(
        `Notification ${savedNotification.ID} saved, but email sending failed.`,
        error instanceof Error ? error.stack : undefined,
      );

      return {
        notification: savedNotification,
        emailStatus: 'failed',
        message: 'Notification saved, but email sending failed.',
      };
    }
  }

  async findByUser(userId: number, pagination: PaginationQueryDto) {
    const result = await this.notificationRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      ...paginationOptions(pagination),
    });
    return paginated(result, pagination);
  }

  async findUnread(userId: number, pagination: PaginationQueryDto) {
    const result = await this.notificationRepository.findAndCount({
      where: { userId, isRead: 0 },
      order: { createdAt: 'DESC' },
      ...paginationOptions(pagination),
    });
    return paginated(result, pagination);
  }

  async markAsRead(id: number, userId: number) {
    const notification = await this.notificationRepository.findOneBy({
      ID: id,
      userId,
    });

    if (!notification) {
      throw new NotFoundException('Notification not found for this user');
    }

    notification.isRead = 1;

    return this.notificationRepository.save(notification);
  }
}
