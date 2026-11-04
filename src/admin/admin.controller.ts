
import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
   Body,
  Patch,
} from '@nestjs/common';
import { UpdateUserStatusDto } from './dto/update-user-status.dto.js';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';


import { UpdateCompanyVerificationDto } from './dto/update-company-verification.js';

import { AdminService } from './admin.service.js';

@ApiTags('Admin')
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
  ) {}
@Get('companies')
@ApiOperation({ summary: 'Get all companies' })
getAllCompanies() {
  return this.adminService.getAllCompanies();
}

@Get('companies/pending')
@ApiOperation({ summary: 'Get companies awaiting verification' })
getPendingCompanies() {
  return this.adminService.getPendingCompanies();
}

@Patch('companies/:id/verify')
@ApiOperation({ summary: 'Verify or reject a company' })
updateCompanyVerification(
  @Param('id', ParseIntPipe) id: number,
  @Body() dto: UpdateCompanyVerificationDto,
) {
  return this.adminService.updateCompanyVerification(id, dto);
}
@Patch('users/:id/status')
@ApiOperation({ summary: 'Activate or suspend a user account' })
async updateUserStatus(
  @Param('id', ParseIntPipe) id: number,
  @Body() updateUserStatusDto: UpdateUserStatusDto,
) {
  return this.adminService.updateUserStatus(
    id,
    updateUserStatusDto,
  );
}

  @Get()
  @ApiOperation({ summary: 'Test Admin Module' })
  getWelcomeMessage() {
    return {
      message: 'Welcome to the Admin Module',
      status: 'success',
    };
  }

  @Get('users')
  @ApiOperation({ summary: 'Get all registered users' })
  async getAllUsers() {
    return this.adminService.getAllUsers();
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiParam({
    name: 'id',
    description: 'The ID of the user',
    example: 1,
  })
  async getUserById(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.adminService.getUserById(id);
  }
}
