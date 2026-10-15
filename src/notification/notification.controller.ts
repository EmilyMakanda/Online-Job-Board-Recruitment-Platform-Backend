
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { NotificationsService } from './notification.service.js';
import { CreateNotificationDto } from './create-notification.dto.js';
import { EmailService } from '../email/email.service.js';

@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly emailService: EmailService,
  ) {}

  @Post()
  create(@Body() dto: CreateNotificationDto) {
    return this.notificationsService.create(dto);
  }

  @Get('user/:userId/unread')
  findUnread(
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.notificationsService.findUnread(userId);
  }

  @Get('user/:userId')
  findByUser(
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.notificationsService.findByUser(userId);
  }

  @Patch('user/:userId/:id/read')
  markAsRead(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.notificationsService.markAsRead(id, userId);
  }
  @Post('test-email')
sendTestEmail(@Body('to') to: string) {
  return this.emailService.sendTestEmail(to);
}
}
