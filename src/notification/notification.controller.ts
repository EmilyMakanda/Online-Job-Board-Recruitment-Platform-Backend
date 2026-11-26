
import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notification.service.js';
import { CreateNotificationDto } from './create-notification.dto.js';
import { EmailService } from '../email/email.service.js';
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard.js';
import { RolesGuard } from '../authentication/guards/roles.guards.js';
import { Roles, UserRole } from '../authentication/roles.decorator.js';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';
import { SendTestEmailDto } from './send-test-email.dto.js';

interface AuthenticatedRequest extends Request {
  user: { sub: number; role: UserRole };
}

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly emailService: EmailService,
  ) {}

  @Post()
  @Roles('admin')
  create(@Body() dto: CreateNotificationDto) {
    return this.notificationsService.create(dto);
  }

  @Get('user/:userId/unread')
  findUnread(
    @Param('userId', ParseIntPipe) userId: number,
    @Query() pagination: PaginationQueryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    this.assertOwnNotifications(userId, req.user.sub);
    return this.notificationsService.findUnread(userId, pagination);
  }

  @Get('user/:userId')
  findByUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Query() pagination: PaginationQueryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    this.assertOwnNotifications(userId, req.user.sub);
    return this.notificationsService.findByUser(userId, pagination);
  }

  @Patch('user/:userId/:id/read')
  markAsRead(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    this.assertOwnNotifications(userId, req.user.sub);
    return this.notificationsService.markAsRead(id, userId);
  }

  @Roles('admin')
  @Post('test-email')
  sendTestEmail(@Body() dto: SendTestEmailDto) {
    return this.emailService.sendTestEmail(dto.to);
  }

  private assertOwnNotifications(requestedUserId: number, userId: number) {
    if (requestedUserId !== userId) {
      throw new ForbiddenException(
        'You can only access your own notifications.',
      );
    }
  }
}
