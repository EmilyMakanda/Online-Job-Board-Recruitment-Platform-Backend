import {
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { ApiAdminOperation, ApiAdminPagination, UseAdminAccess } from '../admin/admin-api.decorators.js';
import { AdminJobResponseDto } from '../admin/dto/admin-responses.dto.js';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';
import { JobService } from './jobs.service.js';

interface AdminRequest extends Request {
  user: { sub: number };
}

@ApiTags('Admin')
@UseAdminAccess()
@Controller('admin/jobs')
export class JobsAdminController {
  constructor(private readonly jobService: JobService) {}

  @Get()
  @ApiAdminPagination()
  @ApiAdminOperation('List all job postings for moderation')
  @ApiResponse({ status: 200, type: AdminJobResponseDto, isArray: true })
  getJobs(@Query() pagination: PaginationQueryDto) {
    return this.jobService.getAdminJobs(pagination);
  }

  @Patch(':id/approve')
  @ApiAdminOperation('Approve a pending job posting')
  @ApiParam({ name: 'id', description: 'Job UUID.' })
  @ApiResponse({ status: 200, type: AdminJobResponseDto })
  @ApiResponse({ status: 404, description: 'Job posting not found.' })
  @ApiResponse({
    status: 409,
    description: 'Only pending jobs from verified companies can be approved.',
  })
  approveJob(@Param('id') id: string, @Req() request: AdminRequest) {
    return this.jobService.approveAdminJob(id, request.user.sub);
  }

  @Patch(':id/reject')
  @ApiAdminOperation('Reject a pending job posting')
  @ApiParam({ name: 'id', description: 'Job UUID.' })
  @ApiResponse({ status: 200, type: AdminJobResponseDto })
  @ApiResponse({ status: 404, description: 'Job posting not found.' })
  @ApiResponse({ status: 409, description: 'Only pending jobs can be rejected.' })
  rejectJob(@Param('id') id: string, @Req() request: AdminRequest) {
    return this.jobService.rejectAdminJob(id, request.user.sub);
  }

  @Delete(':id')
  @ApiAdminOperation(
    'Remove a job from public listings while preserving application history',
  )
  @ApiParam({ name: 'id', description: 'Job UUID.' })
  @ApiResponse({ status: 404, description: 'Job posting not found.' })
  @ApiResponse({ status: 409, description: 'The job has already been removed.' })
  removeJob(@Param('id') id: string, @Req() request: AdminRequest) {
    return this.jobService.removeAdminJob(id, request.user.sub);
  }
}
