import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { ApiAdminOperation, ApiAdminPagination, UseAdminAccess } from '../admin/admin-api.decorators.js';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';
import { ApplicationsService } from './applications.service.js';

@ApiTags('Admin')
@UseAdminAccess()
@Controller('admin/applications')
export class ApplicationsAdminController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Get()
  @ApiAdminPagination()
  @ApiAdminOperation('List applications for administrative monitoring')
  @ApiResponse({
    status: 200,
    description: 'Applications with associated job and company details.',
    isArray: true,
  })
  getApplications(@Query() pagination: PaginationQueryDto) {
    return this.applicationsService.getAdminApplications(pagination);
  }

  @Get(':id')
  @ApiAdminOperation('Get an application and its job details by ID')
  @ApiParam({ name: 'id', type: Number, description: 'Application ID.' })
  @ApiResponse({ status: 200, description: 'Application details.' })
  @ApiResponse({ status: 404, description: 'Application not found.' })
  getApplication(@Param('id', ParseIntPipe) id: number) {
    return this.applicationsService.getAdminApplicationById(id);
  }
}
