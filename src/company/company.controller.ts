
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  ParseUUIDPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import type { Request } from 'express';

import { CompanyService } from './company.service.js';
import { CreateCompanyDto } from './dto/create-company.dto.js';
import { UpdateCompanyDto } from './dto/update-company.dto.js';
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

@ApiTags('Companies')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('companies')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Post()
  @Roles('employer')
  create(
    @Req() req: AuthenticatedRequest,
    @Body() createCompanyDto: CreateCompanyDto,
  ) {
    return this.companyService.create(req.user.sub, createCompanyDto);
  }

  @Get()
  findAll() {
    return this.companyService.findAll();
  }

  // Keep this before @Get(':id') to avoid route matching conflicts.
  @Get('pending')
  @Roles('admin')
  findPendingCompanies() {
    return this.companyService.findPendingCompanies();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.companyService.findOne(id);
  }

  @Patch(':id')
  @Roles('employer')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
    @Body() updateCompanyDto: UpdateCompanyDto,
  ) {
    return this.companyService.update(
      id,
      req.user.sub,
      updateCompanyDto,
    );
  }

  @Patch(':id/verify')
  @Roles('admin')
  verifyCompany(@Param('id', ParseUUIDPipe) id: string) {
    return this.companyService.verifyCompany(id);
  }

  @Patch(':id/reject')
  @Roles('admin')
  rejectCompany(@Param('id', ParseUUIDPipe) id: string) {
    return this.companyService.rejectCompany(id);
  }

  @Delete(':id')
  @Roles('employer')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.companyService.remove(id, req.user.sub);
  }
}
