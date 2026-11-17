import {
  applyDecorators,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard.js';
import { RolesGuard } from '../authentication/guards/roles.guards.js';
import { Roles } from '../authentication/roles.decorator.js';
import { AdminService } from './admin.service.js';
import { UpdateCompanyVerificationDto } from './dto/update-company-verification.js';
import { UpdateReportStatusDto } from './dto/update-report-status.dto.js';
import { UpdateUserStatusDto } from './dto/update-user-status.dto.js';
import {
  AdminApplicationResponseDto,
  AdminCompanyResponseDto,
  AdminJobResponseDto,
  AdminStatisticsResponseDto,
  AdminUserResponseDto,
  AdminUserStatusResponseDto,
} from './dto/admin-responses.dto.js';

interface AdminRequest extends Request {
  user: { sub: number };
}

const ApiAdminOperation = (summary: string) =>
  applyDecorators(
    ApiOperation({
      summary,
      description: 'Requires a valid bearer JWT with the admin role.',
    }),
    ApiResponse({
      status: 400,
      description: 'Request parameters or body failed validation.',
    }),
    ApiResponse({ status: 401, description: 'A valid JWT is required.' }),
    ApiResponse({ status: 403, description: 'Administrator role required.' }),
  );

const ApiAdminPagination = () =>
  applyDecorators(
    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      minimum: 1,
      maximum: 1_000_000,
      example: 1,
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      minimum: 1,
      maximum: 100,
      example: 50,
    }),
  );

@ApiTags('Admin')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
)
@Roles('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  @ApiAdminOperation('Check administrator API access')
  @ApiResponse({ status: 200, description: 'Administrator access confirmed.' })
  getWelcomeMessage() {
    return { message: 'Welcome to the Admin Module', status: 'success' };
  }

  @Get('users')
  @ApiAdminPagination()
  @ApiAdminOperation('List all users without credentials or OTP data')
  @ApiResponse({
    status: 200,
    description:
      'User accounts; password and email verification tokens omitted.',
    type: AdminUserResponseDto,
    isArray: true,
  })
  getAllUsers(@Query() pagination: PaginationQueryDto) {
    return this.adminService.getAllUsers(pagination);
  }

  @Get('users/:id')
  @ApiAdminOperation('Get a user account by ID')
  @ApiParam({ name: 'id', type: Number, description: 'User account ID.' })
  @ApiResponse({
    status: 200,
    description: 'The requested user account.',
    type: AdminUserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'User account not found.' })
  getUserById(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.getUserById(id);
  }

  @Patch('users/:id/activate')
  @ApiAdminOperation('Activate a user account')
  @ApiParam({ name: 'id', type: Number, description: 'User account ID.' })
  @ApiResponse({
    status: 200,
    description: 'User account activated.',
    type: AdminUserStatusResponseDto,
  })
  @ApiResponse({ status: 404, description: 'User account not found.' })
  activateUser(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.activateUser(id);
  }

  @Patch('users/:id/deactivate')
  @ApiAdminOperation('Deactivate another user account')
  @ApiParam({ name: 'id', type: Number, description: 'User account ID.' })
  @ApiResponse({
    status: 200,
    description: 'User account deactivated.',
    type: AdminUserStatusResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Self-deactivation is not allowed.',
  })
  @ApiResponse({ status: 404, description: 'User account not found.' })
  deactivateUser(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AdminRequest,
  ) {
    return this.adminService.deactivateUser(id, request.user.sub);
  }

  @Patch('users/:id/status')
  @ApiAdminOperation('Set a user active state (1 active, 0 inactive)')
  @ApiParam({ name: 'id', type: Number, description: 'User account ID.' })
  @ApiBody({ type: UpdateUserStatusDto })
  @ApiResponse({
    status: 200,
    description: 'User account status updated.',
    type: AdminUserStatusResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Self-deactivation is not allowed.',
  })
  updateUserStatus(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AdminRequest,
    @Body() body: UpdateUserStatusDto,
  ) {
    return this.adminService.updateUserStatus(id, request.user.sub, body);
  }

  @Get('employers')
  @ApiAdminPagination()
  @ApiAdminOperation('List employer accounts and their companies')
  @ApiResponse({
    status: 200,
    description: 'Employer accounts and associated companies.',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 22 },
          name: { type: 'string', example: 'Morgan Employer' },
          email: { type: 'string', example: 'morgan@example.com' },
          role: { type: 'string', example: 'employer' },
          isActive: { type: 'number', example: 1 },
          company: {
            type: 'object',
            nullable: true,
            properties: {
              companyId: { type: 'number', example: 4 },
              companyName: { type: 'string', example: 'Acme Ltd' },
              verificationStatus: { type: 'string', example: 'pending' },
            },
          },
        },
      },
    },
  })
  getAllEmployers(@Query() pagination: PaginationQueryDto) {
    return this.adminService.getAllEmployers(pagination);
  }

  @Get('employers/:id')
  @ApiAdminOperation('Get an employer account and its company')
  @ApiParam({ name: 'id', type: Number, description: 'Employer user ID.' })
  @ApiResponse({
    status: 200,
    description: 'Employer account and its company, if registered.',
    schema: {
      example: {
        id: 22,
        name: 'Morgan Employer',
        email: 'morgan@example.com',
        role: 'employer',
        company: { companyId: 4, companyName: 'Acme Ltd' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Employer account not found.' })
  getEmployerById(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.getEmployerById(id);
  }

  @Get('companies')
  @ApiAdminPagination()
  @ApiAdminOperation('List all companies')
  @ApiResponse({
    status: 200,
    description: 'Company records and verification status.',
    type: AdminCompanyResponseDto,
    isArray: true,
  })
  getAllCompanies(@Query() pagination: PaginationQueryDto) {
    return this.adminService.getAllCompanies(pagination);
  }

  @Get('companies/pending')
  @ApiAdminPagination()
  @ApiAdminOperation('List companies awaiting verification')
  @ApiResponse({
    status: 200,
    description: 'Companies with pending verification status.',
    type: AdminCompanyResponseDto,
    isArray: true,
  })
  getPendingCompanies(@Query() pagination: PaginationQueryDto) {
    return this.adminService.getPendingCompanies(pagination);
  }

  @Patch('companies/:id/verify')
  @ApiAdminOperation('Verify or reject a company')
  @ApiParam({ name: 'id', type: Number, description: 'Company ID.' })
  @ApiBody({ type: UpdateCompanyVerificationDto })
  @ApiResponse({
    status: 200,
    description: 'Company verification updated.',
    schema: {
      example: {
        message: 'Company verification status updated successfully.',
        company: {
          companyId: 4,
          companyName: 'Acme Ltd',
          verificationStatus: 'verified',
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Company not found.' })
  updateCompanyVerification(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: UpdateCompanyVerificationDto,
  ) {
    return this.adminService.updateCompanyVerification(id, body);
  }

  @Get('jobs')
  @ApiAdminPagination()
  @ApiAdminOperation('List all job postings for moderation')
  @ApiResponse({
    status: 200,
    description: 'Job postings including their moderation status.',
    type: AdminJobResponseDto,
    isArray: true,
  })
  getAllJobs(@Query() pagination: PaginationQueryDto) {
    return this.adminService.getAllJobs(pagination);
  }

  @Patch('jobs/:id/approve')
  @ApiAdminOperation('Approve a job posting')
  @ApiParam({ name: 'id', description: 'Job UUID.' })
  @ApiResponse({
    status: 200,
    description: 'Job approved and publicly visible.',
    type: AdminJobResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Job posting not found.' })
  @ApiResponse({ status: 409, description: 'Closed jobs cannot be moderated.' })
  approveJob(@Param('id') id: string) {
    return this.adminService.approveJob(id);
  }

  @Patch('jobs/:id/reject')
  @ApiAdminOperation('Reject a job posting')
  @ApiParam({ name: 'id', description: 'Job UUID.' })
  @ApiResponse({
    status: 200,
    description: 'Job rejected.',
    type: AdminJobResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Job posting not found.' })
  rejectJob(@Param('id') id: string) {
    return this.adminService.rejectJob(id);
  }

  @Delete('jobs/:id')
  @ApiAdminOperation(
    'Remove a job from public listings while preserving application history',
  )
  @ApiParam({ name: 'id', description: 'Job UUID.' })
  @ApiResponse({
    status: 200,
    description: 'Job removed from public listings.',
    schema: {
      example: {
        message: 'Job posting removed from public listings.',
        job: {
          id: '64ccf89b-b176-431a-b31c-68dbdaf8147d',
          title: 'Software Engineer',
          status: 'REMOVED',
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Job posting not found.' })
  removeJob(@Param('id') id: string) {
    return this.adminService.removeJob(id);
  }

  @Get('applications')
  @ApiAdminPagination()
  @ApiAdminOperation('List applications for administrative monitoring')
  @ApiResponse({
    status: 200,
    description: 'Applications with job and company details.',
    type: AdminApplicationResponseDto,
    isArray: true,
  })
  getAllApplications(@Query() pagination: PaginationQueryDto) {
    return this.adminService.getAllApplications(pagination);
  }

  @Get('applications/:id')
  @ApiAdminOperation('Get an application and its job details by ID')
  @ApiParam({ name: 'id', type: Number, description: 'Application ID.' })
  @ApiResponse({
    status: 200,
    description: 'Application details.',
    type: AdminApplicationResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Application not found.' })
  @ApiResponse({
    status: 400,
    description: 'Application ID must be a valid number.',
  })
  getApplicationById(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.getApplicationById(id);
  }

  @Get('reports')
  @ApiAdminPagination()
  @ApiAdminOperation('List user reports')
  @ApiResponse({
    status: 200,
    description: 'User reports awaiting or completed review.',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          reportId: { type: 'number', example: 3 },
          reporterId: { type: 'number', example: 21 },
          targetType: { type: 'string', enum: ['user', 'job'] },
          targetId: {
            type: 'string',
            example: '64ccf89b-b176-431a-b31c-68dbdaf8147d',
          },
          reason: { type: 'string', example: 'Misleading listing' },
          details: {
            type: 'string',
            example: 'The listing contains inaccurate information.',
          },
          status: {
            type: 'string',
            enum: ['pending', 'resolved', 'dismissed'],
          },
          resolution: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          resolvedAt: {
            type: 'string',
            format: 'date-time',
            nullable: true,
          },
        },
      },
    },
  })
  getAllReports(@Query() pagination: PaginationQueryDto) {
    return this.adminService.getAllReports(pagination);
  }

  @Patch('reports/:id/status')
  @ApiAdminOperation('Resolve or dismiss a user report')
  @ApiParam({ name: 'id', type: Number, description: 'Report ID.' })
  @ApiBody({ type: UpdateReportStatusDto })
  @ApiResponse({
    status: 200,
    description: 'Report status updated.',
    schema: {
      example: {
        reportId: 3,
        reporterId: 21,
        targetType: 'job',
        targetId: '64ccf89b-b176-431a-b31c-68dbdaf8147d',
        status: 'resolved',
        resolution: 'Listing corrected.',
        resolvedAt: '2026-11-16T11:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Report not found.' })
  updateReportStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: UpdateReportStatusDto,
  ) {
    return this.adminService.updateReportStatus(id, body);
  }

  @Get('statistics')
  @ApiAdminOperation('Get platform account, job, and application totals')
  @ApiResponse({
    status: 200,
    description: 'Current system statistics.',
    type: AdminStatisticsResponseDto,
  })
  getStatistics() {
    return this.adminService.getStatistics();
  }
}
