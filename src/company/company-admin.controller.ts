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
import { ApiBody, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { ApiAdminOperation, ApiAdminPagination, UseAdminAccess } from '../admin/admin-api.decorators.js';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';
import { CompanyService } from './company.service.js';
import { UpdateCompanyVerificationDto } from './dto/update-company-verification.dto.js';

interface AdminRequest extends Request {
  user: { sub: number };
}

@ApiTags('Admin')
@UseAdminAccess()
@Controller('admin/companies')
export class CompanyAdminController {
  constructor(private readonly companyService: CompanyService) {}

  @Get()
  @ApiAdminPagination()
  @ApiAdminOperation('List all companies')
  @ApiResponse({ status: 200, description: 'Company records.', isArray: true })
  getCompanies(@Query() pagination: PaginationQueryDto) {
    return this.companyService.getAdminCompanies(pagination);
  }

  @Get('pending')
  @ApiAdminPagination()
  @ApiAdminOperation('List companies awaiting verification')
  @ApiResponse({
    status: 200,
    description: 'Companies with pending verification.',
    isArray: true,
  })
  getPendingCompanies(@Query() pagination: PaginationQueryDto) {
    return this.companyService.getAdminPendingCompanies(pagination);
  }

  @Patch(':id/verify')
  @ApiAdminOperation('Verify or reject a company')
  @ApiParam({ name: 'id', type: Number, description: 'Company ID.' })
  @ApiBody({ type: UpdateCompanyVerificationDto })
  @ApiResponse({
    status: 200,
    description: 'Company verification status updated.',
  })
  @ApiResponse({ status: 404, description: 'Company not found.' })
  updateVerification(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AdminRequest,
    @Body() body: UpdateCompanyVerificationDto,
  ) {
    return this.companyService.updateAdminVerification(
      id,
      request.user.sub,
      body,
    );
  }
}
