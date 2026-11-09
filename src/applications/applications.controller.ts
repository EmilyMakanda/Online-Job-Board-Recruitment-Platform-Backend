import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, } from '@nestjs/swagger';
import { ApplicationsService } from './applications.service.js';
import { CreateApplicationDto } from './dto/create-application.dto.js';
import { UpdateApplicationDto } from './dto/update-application.dto.js';
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard.js';
import { RolesGuard } from '../authentication/guards/roles.guards.js';
import { Roles } from '../authentication/roles.decorator.js';

interface AuthenticatedRequest extends Request {
  user: {
    sub: number;
    role: 'job_seeker';
  };
}

@ApiTags('Applications')
@ApiBearerAuth()
@Controller('applications')
@Roles('job_seeker')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post()

  @Roles('job_seeker')
  @ApiOperation({ summary: 'Submit a job application' })
  create(
    @Body() createApplicationDto: CreateApplicationDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.applicationsService.create(createApplicationDto, req.user.sub);
  }

  @Get()
  @Roles('job_seeker')
  @ApiOperation({ summary: 'View the authenticated jobseeker applications' })
  findMine(@Req() req: AuthenticatedRequest) {
    return this.applicationsService.findByJobSeeker(req.user.sub);
  }

  @Get('employer')
  @Roles('employer')
  @ApiOperation({
    summary: 'View applications for my jobs',
  })

  findForEmployer(
    @Req() req: AuthenticatedRequest,
  ){

    return this.applicationsService.findByEmployer(
      req.user.sub,
    );
  }

  @Get('job-seeker/:jobSeekerId')
  @Roles('job_seeker')

  findByJobSeeker(
    @Param('jobSeekerId', ParseIntPipe)
    jobSeekerId: number,

    @Req() req: AuthenticatedRequest,
  ){
    if (jobSeekerId !== req.user.sub){
      throw new ForbiddenException(
        'You can only view your own applications.'
      );
    }
    return this.applicationsService.findByJobSeeker(
      req.user.sub,
    );
  }

  @Get(':id')
  @Roles('job_seeker')
  @ApiOperation({
    summary: 'Get one of the authenticated jobseeker applications',
  })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.applicationsService.findOne(id, req.user.sub);
  }

  @Patch(':id/status')
  @Roles('employer')
  @ApiOperation({
    summary: 'Update application status',
  })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateApplicationDto,
    @Req() req: AuthenticatedRequest, 
  ){
    return this.applicationsService.updateStatus(
      id,
      req.user.sub,
      updateDto,
    );
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update one of the authenticated jobseeker applications',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateApplicationDto: UpdateApplicationDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.applicationsService.update(
      id,
      req.user.sub,
      updateApplicationDto,
    );
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete one of the authenticated jobseeker applications',
  })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.applicationsService.remove(id, req.user.sub);
  }
}
