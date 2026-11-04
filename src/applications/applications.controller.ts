import { Controller, Get, Post, Body, Patch, Param, Delete,ParseIntPipe,UseGuards, } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam,ApiResponse } from '@nestjs/swagger';
import { ApplicationsService } from './applications.service.js';
import { CreateApplicationDto } from './dto/create-application.dto.js';
import { UpdateApplicationDto } from './dto/update-application.dto.js';
import { Application } from './entities/application.entity.js';
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard.js';
import { RolesGuard } from '../authentication/guards/roles.guards.js';
import { Roles } from '../authentication/roles.decorator.js';




@ApiTags('Applications')
@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post(':userID')
  @ApiBearerAuth()
  @Roles('employer')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Submit a ajob application'})
  create(
    @Body() createApplicationDto: CreateApplicationDto,
  ){

    const jobSeekerId = 1;

    return this.applicationsService.create(
      createApplicationDto,
      jobSeekerId,
    );
  }

  @Get()
  @ApiOperation({
    summary: 'View all applications',})
  findAll(){
    return this.applicationsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an application by ID'})
   findOne(
      @Param('id', ParseIntPipe) id: number,
    ){
    return this.applicationsService.findOne(id);
    }

  @Get('job-seeker/:jobSeekerId')
  @ApiOperation({ summary: 'View applications for a job seeker'})
  findByJobSeeker(
    @Param('jobSeekerId',ParseIntPipe) jobSeekerId: number,
  ){
    return this.applicationsService.findByJobSeeker(
      jobSeekerId,
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an application'})
  update(
    @Param('id', ParseIntPipe) id:number,
    @Body() updateApplicationDto: UpdateApplicationDto) {
    return this.applicationsService.update(id, updateApplicationDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an application'})
  remove(
    @Param('id', ParseIntPipe) id: number) {
    return this.applicationsService.remove(id);
  }
}
