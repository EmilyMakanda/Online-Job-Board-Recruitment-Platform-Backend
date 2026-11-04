import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
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

@ApiTags('Jobs')
@Controller('job')
export class JobController {
  constructor(private readonly jobService: JobService) {}

  // Create a job and store the supplied poster ID without looking up a user.
  @Post(':userID')
  @ApiBearerAuth()
  @Roles('employer')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    summary: 'Create a new job listing for a supplied poster ID',
  })
  @ApiParam({
    name: 'userID',
    type: Number,
    description: 'Employer account ID posting the job',
    example: 42,
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
  createJob(@Body() dto: CreateJobDto, @Param('userID') userID: string) {
    return this.jobService.createJob(dto, userID);
  }

  // Return all jobs.
  @Get()
  @ApiOperation({ summary: 'Retrieve all job listings' })
  @ApiResponse({ status: 200, description: 'A list of all job listings.' })
  getAllJobs() {
    return this.jobService.getAllJobs();
  }

  // Return one job by its ID.
  @Get(':jobID')
  @ApiOperation({ summary: 'Retrieve a specific job listing by its ID' })
  @ApiParam({
    name: 'jobID',
    description: 'The ID of the job listing to retrieve',
    example: 'JOB-1001',
  })
  @ApiResponse({ status: 200, description: 'The requested job listing.' })
  @ApiResponse({ status: 404, description: 'Job listing not found.' })
  getOneJob(@Param('jobID') jobID: string) {
    return this.jobService.getOneJob(jobID);
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
    example: 'JOB-1001',
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
  updateJob(@Param('jobID') jobID: string, @Body() dto: UpdateJobDto) {
    return this.jobService.updateJob(jobID, dto);
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
    example: 'JOB-1001',
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
  deleteJob(@Param('jobID') jobID: string) {
    return this.jobService.deleteJob(jobID);
  }
}
