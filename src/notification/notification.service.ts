
import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './notification.entity.js';
import { CreateNotificationDto } from './create-notification.dto.js';
import { EmailService } from '../email/email.service.js';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly emailService: EmailService,
  ) {}

  async create(dto: CreateNotificationDto) {
    const email = dto.email ?? 'chancynyirongo929@gmail.com';

    // Save the notification in Oracle first.
    const notification = this.notificationRepository.create({
      userId: dto.userId,
      message: dto.message,
      email,
      isRead: 0,
    });

    const savedNotification =
      await this.notificationRepository.save(notification);

    // Try sending the email without losing the saved notification.
    try {
      const emailResult =
        await this.emailService.sendNotificationEmail(
          email,
          'Job Board Notification',
          dto.message,
        );

      return {
        notification: savedNotification,
        emailStatus: 'test_email_created',
       
      };
    } catch {
      return {
        notification: savedNotification,
        emailStatus: 'failed',
        message: 'Notification saved, but test email could not be created.',
      };
    }
  }

  async findByUser(userId: number) {
    return this.notificationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findUnread(userId: number) {
    return this.notificationRepository.find({
      where: { userId, isRead: 0 },
      order: { createdAt: 'DESC' },
    });
  }

  async markAsRead(id: number, userId: number) {
    const notification = await this.notificationRepository.findOneBy({
    
      userId,
    });

    if (!notification) {
      throw new NotFoundException(
        'Notification not found for this user',
      );
    }

    notification.isRead = 1;

    return this.notificationRepository.save(notification);
  }
}
