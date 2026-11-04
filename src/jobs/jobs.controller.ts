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

interface AuthenticatedRequest extends Request {
  user: {
    sub: number;
    role: 'job_seeker' | 'employer';
  };
}

@ApiTags('Jobs')
@Controller('job')
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @Post()
  @ApiBearerAuth()
  @Roles('employer')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    summary: 'Create a job listing for the authenticated employer',
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
    description: 'Only employers can create job listings.',
  })
  createJob(@Body() dto: CreateJobDto, @Req() req: AuthenticatedRequest) {
    return this.jobService.createJob(dto, req.user.sub);
  }

  @Get('my-jobs')
  @ApiBearerAuth()
  @Roles('employer')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'List jobs posted by the authenticated employer' })
  getMyJobs(@Req() req: AuthenticatedRequest) {
    return this.jobService.getJobsByEmployer(req.user.sub);
  }

  @Get('search')
  @ApiBearerAuth()
  @Roles('job_seeker')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Search job listings by title' })
  searchJobs(@Query('name') name: string) {
    return this.jobService.searchJobsByName(name);
  }

  @Get()
  @ApiBearerAuth()
  @Roles('job_seeker')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Retrieve all job listings' })
  @ApiResponse({ status: 200, description: 'A list of all job listings.' })
  getAllJobs() {
    return this.jobService.getAllJobs();
  }

  // Return one job by its ID.
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

  // Update the supplied fields for a job.
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
  @ApiResponse({
    status: 401,
    description: 'A valid access token is required.',
  })
  @ApiResponse({
    status: 403,
    description: 'Only employers can update job listings.',
  })
  @ApiResponse({ status: 404, description: 'Job listing not found.' })
  updateJob(
    @Param('jobID') jobID: string,
    @Body() dto: UpdateJobDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.jobService.updateJob(jobID, dto, req.user.sub);
  }

  // Delete a job by its ID.
  @Delete(':jobID')
  @ApiBearerAuth()
  @Roles('employer')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Delete a specific job listing by its ID' })
  @ApiParam({
    name: 'jobID',
    description: 'The ID of the job listing to delete',
    example: '42f83d15-c798-4a46-9e83-d0fdb60a5e15',
  })
  @ApiResponse({
    status: 200,
    description: 'The job listing has been successfully deleted.',
  })
  @ApiResponse({
    status: 401,
    description: 'A valid access token is required.',
  })
  @ApiResponse({
    status: 403,
    description: 'Only employers can delete job listings.',
  })
  @ApiResponse({ status: 404, description: 'Job listing not found.' })
  deleteJob(@Param('jobID') jobID: string, @Req() req: AuthenticatedRequest) {
    return this.jobService.deleteJob(jobID, req.user.sub);
  }
}
