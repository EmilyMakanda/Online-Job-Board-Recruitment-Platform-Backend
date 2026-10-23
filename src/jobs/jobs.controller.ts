import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
} from '@nestjs/common';
import { JobService } from './jobs.service.js';
import { CreateJobDto } from './dto/create-job.dto.js';
import { UpdateJobDto } from './dto/update-job.dto.js';
import { ApiTags, ApiParam, ApiResponse, ApiOperation } from '@nestjs/swagger';

@ApiTags('Jobs')
@Controller('job')
export class JobController {
    constructor(private readonly jobService: JobService) {}

    // Create a job and store the supplied poster ID without looking up a user.
    @Post(':userID')
    @ApiOperation({ summary: 'Create a new job listing for a supplied poster ID' })
    @ApiParam({ name: 'userID', description: 'The poster ID to store with the job listing' })
    @ApiResponse({ status: 201, description: 'The job listing has been successfully created.' })
    createJob(
        @Body() dto: CreateJobDto,
        @Param('userID') userID: string,
    ) {
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
    @ApiParam({ name: 'jobID', description: 'The ID of the job listing to retrieve' })
    @ApiResponse({ status: 200, description: 'The requested job listing.' })
    @ApiResponse({ status: 404, description: 'Job listing not found.' })
    getOneJob(@Param('jobID') jobID: string) {
        return this.jobService.getOneJob(jobID);
    }

    // Update the supplied fields for a job.
    @Patch(':jobID')
    @ApiOperation({ summary: 'Update a specific job listing by its ID' })
    @ApiParam({ name: 'jobID', description: 'The ID of the job listing to update' })
    @ApiResponse({ status: 200, description: 'The updated job listing.' })
    @ApiResponse({ status: 404, description: 'Job listing not found.' })
    updateJob(
        @Param('jobID') jobID: string,
        @Body() dto: UpdateJobDto,
    ) {
        return this.jobService.updateJob(jobID, dto);
    }

    // Delete a job by its ID.
    @Delete(':jobID')
    @ApiOperation({ summary: 'Delete a specific job listing by its ID' })
    @ApiParam({ name: 'jobID', description: 'The ID of the job listing to delete' })
    @ApiResponse({ status: 200, description: 'The job listing has been successfully deleted.' })
    @ApiResponse({ status: 404, description: 'Job listing not found.' })
    deleteJob(@Param('jobID') jobID: string) {
        return this.jobService.deleteJob(jobID);
    }
}