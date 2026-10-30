import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  ParseIntPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import type { Request } from 'express';

import { CompanyService } from './company.service.js';
import { CreateCompanyDto } from './dto/create-company.dto.js';
import { UpdateCompanyDto } from './dto/update-company.dto.js';
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard.js';
import { RolesGuard } from '../authentication/guards/roles.guards.js';
import { Roles, UserRole } from '../authentication/roles.decorator.js';

interface AuthenticatedRequest extends Request {
  user: { sub: number; email: string; role: UserRole };
}

@ApiTags('Companies')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('companies')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Post()
  @Roles('employer')
  @ApiOperation({ summary: 'Register your company (employers only)' })
  @ApiResponse({ status: 201, description: 'Company registered successfully' })
  @ApiResponse({ status: 401, description: 'Missing or invalid token' })
  @ApiResponse({ status: 403, description: 'Only employers can register a company' })
  @ApiResponse({ status: 409, description: 'Employer already has a company' })
  create(
    @Req() req: AuthenticatedRequest,
    @Body() createCompanyDto: CreateCompanyDto,
  ) {
    return this.companyService.create(req.user.sub, createCompanyDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all companies' })
  findAll() {
    return this.companyService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a company by ID' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.companyService.findOne(id);
  }

  @Patch(':id')
  @Roles('employer')
  @ApiOperation({ summary: 'Update your company (owner only)' })
  @ApiResponse({ status: 403, description: 'Not the owner of this company' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
    @Body() updateCompanyDto: UpdateCompanyDto,
  ) {
    return this.companyService.update(id, req.user.sub, updateCompanyDto);
  }

  @Delete(':id')
  @Roles('employer')
  @ApiOperation({ summary: 'Delete your company (owner only)' })
  @ApiResponse({ status: 403, description: 'Not the owner of this company' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.companyService.remove(id, req.user.sub);
  }
}