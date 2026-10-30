import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';

import { UsersService } from './users.service.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard.js';
import { RolesGuard } from '../authentication/guards/roles.guards.js';
import { Roles, UserRole } from '../authentication/roles.decorator.js';

interface AuthenticatedRequest extends Request {
  user: {
    sub: number;
    email: string;
    role: UserRole;
  };
}

const USER_EXAMPLE = {
  id: 21,
  name: 'Jordan Makanda',
  email: 'jordan@example.com',
  phone: '+265999123456',
  location: 'Lilongwe',
  resumeUrl: 'uploads/cvs/jordan-cv.pdf',
  skills: 'NestJS, TypeORM, SQL',
  role: 'job_seeker',
  isEmailVerified: 1,
  createdAt: '2026-01-15T10:30:00.000Z',
};

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles('employer')
  @ApiOperation({ summary: 'Get all users (employers only)' })
  @ApiResponse({
    status: 200,
    description: 'User records, excluding password hashes.',
    schema: { example: [USER_EXAMPLE] },
  })
  @ApiResponse({ status: 401, description: 'A valid access token is required.' })
  @ApiResponse({ status: 403, description: 'Only employers can list all users.' })
  findAll() {
    return this.usersService.findAllUsers();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get your account by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Your account ID', example: 21 })
  @ApiResponse({
    status: 200,
    description: 'Account details, excluding password hashes.',
    schema: { example: USER_EXAMPLE },
  })
  @ApiResponse({ status: 401, description: 'A valid access token is required.' })
  @ApiResponse({ status: 403, description: 'You can only view your own profile.' })
  @ApiResponse({ status: 404, description: 'Account not found.' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    if (req.user.sub !== id) {
      throw new ForbiddenException('You can only view your own profile.');
    }

    return this.usersService.findUser(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update your profile' })
  @ApiParam({ name: 'id', type: Number, description: 'Your account ID', example: 21 })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({
    status: 200,
    description: 'Updated account details.',
    schema: { example: USER_EXAMPLE },
  })
  @ApiResponse({ status: 401, description: 'A valid access token is required.' })
  @ApiResponse({ status: 403, description: 'You can only update your own profile.' })
  @ApiResponse({ status: 404, description: 'Account not found.' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateUserDto,
    @Req() req: AuthenticatedRequest,
  ) {
    if (req.user.sub !== id) {
      throw new ForbiddenException('You can only update your own profile.');
    }

    return this.usersService.updateUser(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete your account' })
  @ApiParam({ name: 'id', type: Number, description: 'Your account ID', example: 21 })
  @ApiResponse({ status: 200, description: 'Account deleted successfully.' })
  @ApiResponse({ status: 401, description: 'A valid access token is required.' })
  @ApiResponse({ status: 403, description: 'You can only delete your own account.' })
  @ApiResponse({ status: 404, description: 'Account not found.' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    if (req.user.sub !== id) {
      throw new ForbiddenException('You can only delete your own account.');
    }

    return this.usersService.removeUser(id);
  }
}