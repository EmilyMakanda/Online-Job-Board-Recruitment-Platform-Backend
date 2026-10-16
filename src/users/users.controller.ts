import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service.js';
import { CreateJobSeekerDto } from './dto/create-jobseeker.dto.js';
import { CreateEmployerDto } from './dto/create-employer.dto.js';
import { UpdateJobSeekerDto } from './dto/update-jobseeker.dto.js';
import { UpdateEmployerDto } from './dto/update-employer.dto.js';

@ApiTags('users')
@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('jobseekers')
  createJobseeker(@Body() dto: CreateJobSeekerDto) {
    return this.usersService.createJobseeker(dto);
  }

  @Get('jobseekers')
  findAllJobseekers() {
    return this.usersService.findAllJobseekers();
  }

  @Get('jobseekers/:id')
  findJobseeker(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findJobseeker(id);
  }

  @Patch('jobseekers/:id')
  updateJobseeker(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateJobSeekerDto,
  ) {
    return this.usersService.updateJobseeker(id, dto);
  }

  @Delete('jobseekers/:id')
  removeJobseeker(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.removeJobseeker(id);
  }

  @Post('employers')
  createEmployer(@Body() dto: CreateEmployerDto) {
    return this.usersService.createEmployer(dto);
  }

  @Get('employers')
  findAllEmployers() {
    return this.usersService.findAllEmployers();
  }

  @Get('employers/:id')
  findEmployer(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findEmployer(id);
  }

  @Patch('employers/:id')
  updateEmployer(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEmployerDto,
  ) {
    return this.usersService.updateEmployer(id, dto);
  }

  @Delete('employers/:id')
  removeEmployer(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.removeEmployer(id);
  }
}
