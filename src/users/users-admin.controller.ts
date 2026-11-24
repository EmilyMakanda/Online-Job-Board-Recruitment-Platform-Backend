import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  ApiBody,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { ApiAdminOperation, ApiAdminPagination, UseAdminAccess } from '../admin/admin-api.decorators.js';
import {
  AdminUserResponseDto,
  AdminUserRoleResponseDto,
  AdminUserStatusResponseDto,
} from '../admin/dto/admin-responses.dto.js';
import { UpdateUserRoleDto } from '../admin/dto/update-user-role.dto.js';
import { UpdateUserStatusDto } from '../admin/dto/update-user-status.dto.js';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';
import { UsersService } from './users.service.js';

interface AdminRequest extends Request {
  user: { sub: number };
}

@ApiTags('Admin')
@UseAdminAccess()
@Controller('admin')
export class UsersAdminController {
  constructor(private readonly usersService: UsersService) {}

  @Get('users')
  @ApiAdminPagination()
  @ApiAdminOperation('List user accounts without credentials or OTP data')
  @ApiResponse({
    status: 200,
    description: 'User accounts with sensitive credential fields omitted.',
    type: AdminUserResponseDto,
    isArray: true,
  })
  getUsers(@Query() pagination: PaginationQueryDto) {
    return this.usersService.getAdminUsers(pagination);
  }

  @Get('users/:id')
  @ApiAdminOperation('Get a user account by ID')
  @ApiParam({ name: 'id', type: Number, description: 'User account ID.' })
  @ApiResponse({ status: 200, type: AdminUserResponseDto })
  @ApiResponse({ status: 404, description: 'User account not found.' })
  getUser(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.getAdminUserById(id);
  }

  @Patch('users/:id/status')
  @ApiAdminOperation('Set a user active state (1 active, 0 inactive)')
  @ApiParam({ name: 'id', type: Number, description: 'User account ID.' })
  @ApiBody({ type: UpdateUserStatusDto })
  @ApiResponse({ status: 200, type: AdminUserStatusResponseDto })
  @ApiResponse({ status: 404, description: 'User account not found.' })
  @ApiResponse({
    status: 409,
    description: 'The last active administrator cannot be deactivated.',
  })
  updateUserStatus(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AdminRequest,
    @Body() body: UpdateUserStatusDto,
  ) {
    return this.usersService.updateAdminUserStatus(id, request.user.sub, body);
  }

  @Patch('users/:id/role')
  @ApiAdminOperation('Assign a role to a user account')
  @ApiParam({ name: 'id', type: Number, description: 'User account ID.' })
  @ApiBody({ type: UpdateUserRoleDto })
  @ApiResponse({ status: 200, type: AdminUserRoleResponseDto })
  @ApiResponse({ status: 404, description: 'User account not found.' })
  @ApiResponse({
    status: 409,
    description: 'The last active administrator cannot be demoted.',
  })
  updateUserRole(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AdminRequest,
    @Body() body: UpdateUserRoleDto,
  ) {
    return this.usersService.updateAdminUserRole(id, request.user.sub, body);
  }

  @Get('employers')
  @ApiAdminPagination()
  @ApiAdminOperation('List employer accounts and their companies')
  @ApiResponse({ status: 200, description: 'Employer accounts and companies.' })
  getEmployers(@Query() pagination: PaginationQueryDto) {
    return this.usersService.getAdminEmployers(pagination);
  }

  @Get('employers/:id')
  @ApiAdminOperation('Get an employer account and its company')
  @ApiParam({ name: 'id', type: Number, description: 'Employer user ID.' })
  @ApiResponse({ status: 404, description: 'Employer account not found.' })
  getEmployer(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.getAdminEmployerById(id);
  }
}
