import { Controller, Get, Query } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';

import {
  ApiAdminOperation,
  ApiAdminPagination,
  UseAdminAccess,
} from './admin-api.decorators.js';
import { AdminService } from './admin.service.js';
import { AdminAuditLogResponseDto } from './dto/admin-audit-log-response.dto.js';
import { AdminStatisticsResponseDto } from './dto/admin-responses.dto.js';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';

@ApiTags('Admin')
@UseAdminAccess()
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  @ApiAdminOperation('Check administrator API access')
  @ApiResponse({ status: 200, description: 'Administrator access confirmed.' })
  getWelcomeMessage() {
    return { message: 'Welcome to the Admin API', status: 'success' };
  }

  @Get('audit-logs')
  @ApiAdminPagination()
  @ApiAdminOperation('List privileged administrative actions')
  @ApiResponse({
    status: 200,
    description: 'Admin audit records, newest first.',
    type: AdminAuditLogResponseDto,
    isArray: true,
  })
  getAuditLogs(@Query() pagination: PaginationQueryDto) {
    return this.adminService.getAuditLogs(pagination);
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
