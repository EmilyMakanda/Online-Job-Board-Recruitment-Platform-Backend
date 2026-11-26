
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import type { Request } from 'express';
import { JobService } from './jobs.service.js';
import { CreateJobDto } from './dto/create-job.dto.js';
import { UpdateJobDto } from './dto/update-job.dto.js';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard.js';
import { RolesGuard } from '../authentication/guards/roles.guards.js';
import { Roles } from '../authentication/roles.decorator.js';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';

interface AuthenticatedRequest extends Request {
  user: {
    sub: number;
    role: 'job_seeker' | 'employer' | 'admin';
  };
}

@ApiTags('Jobs')
@Controller('job')
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
)
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @Post()
  @ApiBearerAuth()
  @Roles('employer')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    summary: 'Create an immediately available job listing',
  })
  @ApiResponse({
    status: 201,
    description: 'The job listing has been successfully created.',
  })
  @ApiResponse({
    status: 401,
    description: 'A valid access token is required.',
  })
  @ApiResponse({
    status: 403,
    description: 'Only eligible employers can create job listings.',
  })
  createJob(@Body() dto: CreateJobDto, @Req() req: AuthenticatedRequest) {
    return this.jobService.createJob(dto, req.user.sub);
  }

  @Patch(':jobID/publish')
  @ApiBearerAuth()
  @Roles('employer')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    summary: 'Publish an employer-owned eligible job listing immediately',
  })
  publishJob(@Param('jobID') jobID: string, @Req() req: AuthenticatedRequest) {
    return this.jobService.publishJob(jobID, req.user.sub);
  }

  @Patch(':jobID/close')
  @ApiBearerAuth()
  @Roles('employer')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Close an employer-owned job listing' })
  closeJob(@Param('jobID') jobID: string, @Req() req: AuthenticatedRequest) {
    return this.jobService.closeJob(jobID, req.user.sub);
  }

  @Get('my-jobs')
  @ApiBearerAuth()
  @Roles('employer')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'List jobs posted by the authenticated employer' })
  getMyJobs(
    @Req() req: AuthenticatedRequest,
    @Query() pagination: PaginationQueryDto,
  ) {
    return this.jobService.getJobsByEmployer(req.user.sub, pagination);
  }

  @Get('search')
  @ApiBearerAuth()
  @Roles('job_seeker')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    summary: 'Search available job listings by title, description, or location',
  })
  searchJobs(
    @Query('q') query: string,
    @Query('name') legacyName: string,
    @Query('location') location: string,
    @Query() pagination: PaginationQueryDto,
  ) {
    return this.jobService.searchJobsByName(
      query?.trim() || legacyName,
      location,
      pagination,
    );
  }

  @Get()
  @ApiBearerAuth()
  @Roles('job_seeker')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Retrieve all available job listings' })
  @ApiResponse({
    status: 200,
    description: 'A list of available job listings.',
  })
  getAllJobs(@Query() pagination: PaginationQueryDto) {
    return this.jobService.getAllJobs(pagination);
  }

  @Get(':jobID')
  @ApiBearerAuth()
  @Roles('employer', 'job_seeker')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Retrieve a specific job listing by its ID' })
  @ApiParam({
    name: 'jobID',
    description: 'The ID of the job listing to retrieve',
    example: '42f83d15-c798-4a46-9e83-d0fdb60a5e15',
  })
  @ApiResponse({ status: 200, description: 'The requested job listing.' })
  @ApiResponse({ status: 404, description: 'Job listing not found.' })
  getOneJob(@Param('jobID') jobID: string, @Req() req: AuthenticatedRequest) {
    return req.user.role === 'employer'
      ? this.jobService.getOneJobForEmployer(jobID, req.user.sub)
      : this.jobService.getOneJob(jobID);
  }

  @Patch(':jobID')
  @ApiBearerAuth()
  @Roles('employer')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Update a specific job listing by its ID' })
  @ApiParam({
    name: 'jobID',
    description: 'The ID of the job listing to update',
    example: '42f83d15-c798-4a46-9e83-d0fdb60a5e15',
  })
  @ApiResponse({ status: 200, description: 'The updated job listing.' })
  @ApiResponse({ status: 404, description: 'Job listing not found.' })
  updateJob(
    @Param('jobID') jobID: string,
    @Body() dto: UpdateJobDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.jobService.updateJob(jobID, dto, req.user.sub);
  }

  @Delete(':jobID')
  @ApiBearerAuth()
  @Roles('employer')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    summary: 'Close a job listing and retain its application history',
  })
  @ApiParam({
    name: 'jobID',
    description: 'The ID of the job listing to delete',
    example: '42f83d15-c798-4a46-9e83-d0fdb60a5e15',
  })
  @ApiResponse({
    status: 200,
    description: 'The job listing is no longer public and remains in history.',
  })
  @ApiResponse({ status: 404, description: 'Job listing not found.' })
  deleteJob(@Param('jobID') jobID: string, @Req() req: AuthenticatedRequest) {
    return this.jobService.deleteJob(jobID, req.user.sub);
  }
}
