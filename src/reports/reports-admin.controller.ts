import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  ApiBody,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { ApiAdminOperation, ApiAdminPagination, UseAdminAccess } from '../admin/admin-api.decorators.js';
import { UpdateReportStatusDto } from '../admin/dto/update-report-status.dto.js';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';
import { ReportsService } from './reports.service.js';

interface AdminRequest extends Request {
  user: { sub: number };
}

@ApiTags('Admin')
@UseAdminAccess()
@Controller('admin/reports')
export class ReportsAdminController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  @ApiAdminPagination()
  @ApiAdminOperation('List user reports')
  @ApiResponse({ status: 200, description: 'User reports.', isArray: true })
  getReports(@Query() pagination: PaginationQueryDto) {
    return this.reportsService.getAdminReports(pagination);
  }

  @Patch(':id/status')
  @ApiAdminOperation('Resolve or dismiss a user report')
  @ApiParam({ name: 'id', type: Number, description: 'Report ID.' })
  @ApiBody({ type: UpdateReportStatusDto })
  @ApiResponse({ status: 200, description: 'Report status updated.' })
  @ApiResponse({ status: 404, description: 'Report not found.' })
  @ApiResponse({
    status: 409,
    description: 'Only pending reports can be reviewed.',
  })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AdminRequest,
    @Body() body: UpdateReportStatusDto,
  ) {
    return this.reportsService.updateAdminReportStatus(
      id,
      body,
      request.user.sub,
    );
  }
}
