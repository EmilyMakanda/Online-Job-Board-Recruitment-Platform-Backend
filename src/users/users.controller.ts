import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  ForbiddenException,
  UseGuards,
  Req,
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

interface AuthenticatedRequest extends Request {
  user: {
    sub: number;
    email: string;
    role: 'job_seeker' | 'employer';
  };
}

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({
    status: 200,
    description: 'User records, excluding password hashes.',
    schema: {
      example: [
        {
          id: 21,
          name: 'Jordan Makanda',
          email: 'jordan@example.com',
          role: 'job_seeker',
          isEmailVerified: 1,
          createdAt: '2025-01-15T10:30:00.000Z',
        },
      ],
    },
  })
  @ApiResponse({
    status: 401,
    description: 'A valid access token is required.',
  })
  @ApiResponse({
    status: 403,
    description: 'Only employers can list all users.',
  })
  findAll(@Req() req: AuthenticatedRequest) {
    if (req.user.role !== 'employer') {
      throw new ForbiddenException(
        'Only employers can access the complete user list.',
      );
    }

    return this.usersService.findAll();
  }

  @Get('jobseekers')
  @ApiOperation({ summary: 'Get all job seekers' })
  @ApiResponse({
    status: 200,
    description: 'Job seeker records, excluding password hashes.',
    schema: {
      example: [
        {
          id: 21,
          name: 'Jordan Makanda',
          email: 'jordan@example.com',
          role: 'job_seeker',
          isEmailVerified: 1,
          createdAt: '2025-01-15T10:30:00.000Z',
        },
      ],
    },
  })
  @ApiResponse({
    status: 401,
    description: 'A valid access token is required.',
  })
  @ApiResponse({
    status: 403,
    description: 'Only employers can list job seekers.',
  })
  findAllJobseekers(@Req() req: AuthenticatedRequest) {
    if (req.user.role !== 'employer') {
      throw new ForbiddenException(
        'Only employers can access the job seeker list.',
      );
    }

    return this.usersService.findAllJobseekers();
  }

  @Get('employers')
  @ApiOperation({ summary: 'Get all employers' })
  @ApiResponse({
    status: 200,
    description: 'Employer records, excluding password hashes.',
    schema: {
      example: [
        {
          id: 42,
          name: 'Acme Recruiting',
          email: 'hiring@acme.example',
          role: 'employer',
          isEmailVerified: 1,
          createdAt: '2025-01-15T10:30:00.000Z',
        },
      ],
    },
  })
  @ApiResponse({
    status: 401,
    description: 'A valid access token is required.',
  })
  @ApiResponse({
    status: 403,
    description: 'Only employers can list employers.',
  })
  findAllEmployers(@Req() req: AuthenticatedRequest) {
    if (req.user.role !== 'employer') {
      throw new ForbiddenException(
        'Only employers can access the employer list.',
      );
    }

    return this.usersService.findAllEmployers();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get your account by ID' })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Your account ID',
    example: 21,
  })
  @ApiResponse({
    status: 200,
    description: 'Account details, excluding password hashes.',
    schema: {
      example: {
        id: 21,
        name: 'Jordan Makanda',
        email: 'jordan@example.com',
        role: 'job_seeker',
        isEmailVerified: 1,
        createdAt: '2025-01-15T10:30:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'A valid access token is required.',
  })
  @ApiResponse({
    status: 403,
    description: 'You can only view your own profile.',
  })
  @ApiResponse({ status: 404, description: 'Account not found.' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    if (req.user.sub !== id) {
      throw new ForbiddenException('You can only view your own profile.');
    }

    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update your name or email' })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Your account ID',
    example: 21,
  })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({
    status: 200,
    description: 'Updated account details.',
    schema: {
      example: {
        id: 21,
        name: 'Jordan M. Makanda',
        email: 'jordan.makanda@example.com',
        role: 'job_seeker',
        isEmailVerified: 0,
        createdAt: '2025-01-15T10:30:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'A valid access token is required.',
  })
  @ApiResponse({
    status: 403,
    description: 'You can only update your own profile.',
  })
  @ApiResponse({ status: 404, description: 'Account not found.' })
  @ApiResponse({
    status: 409,
    description: 'Email address is already registered.',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateUserDto,
    @Req() req: AuthenticatedRequest,
  ) {
    if (req.user.sub !== id) {
      throw new ForbiddenException('You can only update your own profile.');
    }

    return this.usersService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete your account' })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Your account ID',
    example: 21,
  })
  @ApiResponse({
    status: 200,
    description: 'Account deleted successfully.',
    schema: {
      example: { message: 'User with ID 21 deleted successfully' },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'A valid access token is required.',
  })
  @ApiResponse({
    status: 403,
    description: 'You can only delete your own account.',
  })
  @ApiResponse({ status: 404, description: 'Account not found.' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    if (req.user.sub !== id) {
      throw new ForbiddenException('You can only delete your own account.');
    }

    return this.usersService.remove(id);
  }
}
