import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard.js';
import { RolesGuard } from '../authentication/guards/roles.guards.js';
import { Roles } from '../authentication/roles.decorator.js';
import { CreateReportDto } from './dto/create-report.dto.js';
import { ReportsService } from './reports.service.js';
import { ListReportsQueryDto } from './dto/list-reports-query.dto.js';
import { ResolveReportDto } from './dto/resolve-report.dto.js';

interface AuthenticatedRequest extends Request {
  user: { sub: number };
}

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('job_seeker', 'employer')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  @Roles('admin')
  findAll(@Query() query: ListReportsQueryDto) {
    return this.reportsService.findAll(query, query.status);
  }

  @Patch(':id')
  @Roles('admin')
  resolve(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ResolveReportDto,
  ) {
    return this.reportsService.resolve(id, dto);
  }

  @Post()
  @ApiOperation({ summary: 'Report a job posting or another user' })
  @ApiResponse({ status: 201, description: 'Report submitted for review.' })
  @ApiResponse({ status: 400, description: 'Report details are invalid.' })
  @ApiResponse({ status: 404, description: 'Reported target not found.' })
  create(@Body() dto: CreateReportDto, @Req() request: AuthenticatedRequest) {
    return this.reportsService.create(request.user.sub, dto);
  }
}
