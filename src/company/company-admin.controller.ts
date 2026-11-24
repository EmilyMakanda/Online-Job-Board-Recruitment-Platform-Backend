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
import { AdminCompanyResponseDto } from '../admin/dto/admin-responses.dto.js';
import { UpdateCompanyVerificationDto } from '../admin/dto/update-company-verification.js';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';
import { CompanyService } from './company.service.js';

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
  @ApiResponse({ status: 200, type: AdminCompanyResponseDto, isArray: true })
  getCompanies(@Query() pagination: PaginationQueryDto) {
    return this.companyService.getAdminCompanies(pagination);
  }

  @Get('pending')
  @ApiAdminPagination()
  @ApiAdminOperation('List companies awaiting verification')
  @ApiResponse({ status: 200, type: AdminCompanyResponseDto, isArray: true })
  getPendingCompanies(@Query() pagination: PaginationQueryDto) {
    return this.companyService.getAdminPendingCompanies(pagination);
  }

  @Patch(':id/verify')
  @ApiAdminOperation('Verify or reject a company')
  @ApiParam({ name: 'id', type: Number, description: 'Company ID.' })
  @ApiBody({ type: UpdateCompanyVerificationDto })
  @ApiResponse({ status: 200, type: AdminCompanyResponseDto })
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
