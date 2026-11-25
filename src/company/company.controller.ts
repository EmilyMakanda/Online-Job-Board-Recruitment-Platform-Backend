
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  ParseUUIDPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import type { Request } from 'express';

import { CompanyService } from './company.service.js';
import { CreateCompanyDto } from './dto/create-company.dto.js';
import { UpdateCompanyDto } from './dto/update-company.dto.js';
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard.js';
import { RolesGuard } from '../authentication/guards/roles.guards.js';
import { Roles, UserRole } from '../authentication/roles.decorator.js';

interface AuthenticatedRequest extends Request {
  user: {
    sub: number;
    email: string;
    role: UserRole;
  };
}

@ApiTags('Companies')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('companies')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Post()
  @Roles('employer')
  @ApiOperation({ summary: 'Register a company (employers only)' })
  @ApiResponse({
    status: 201,
    description: 'Company registered successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid company registration details',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid authentication token',
  })
  @ApiResponse({
    status: 403,
    description: 'Only employers can register a company',
  })
  @ApiResponse({
    status: 404,
    description: 'Employer user does not exist',
  })
  @ApiResponse({
    status: 409,
    description:
      'Employer already has a company or registration number is already in use',
  })
  create(
    @Req() req: AuthenticatedRequest,
    @Body() createCompanyDto: CreateCompanyDto,
  ) {
    return this.companyService.create(req.user.sub, createCompanyDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all registered companies' })
  @ApiResponse({
    status: 200,
    description: 'Companies retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid authentication token',
  })
  findAll() {
    return this.companyService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a company by its UUID' })
  @ApiResponse({
    status: 200,
    description: 'Company retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Company not found',
  })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.companyService.findOne(id);
  }

  @Patch(':id')
  @Roles('employer')
  @ApiOperation({ summary: 'Update your company (owner only)' })
  @ApiResponse({
    status: 200,
    description: 'Company updated successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'You are not the owner of this company',
  })
  @ApiResponse({
    status: 404,
    description: 'Company not found',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
    @Body() updateCompanyDto: UpdateCompanyDto,
  ) {
    return this.companyService.update(
      id,
      req.user.sub,
      updateCompanyDto,
    );
  }

  @Get('pending')
@Roles('admin')
@ApiOperation({ summary: 'Get companies awaiting verification (admin only)' })
@ApiResponse({
  status: 200,
  description: 'Pending companies retrieved successfully',
})
@ApiResponse({
  status: 403,
  description: 'Only administrators can view pending companies',
})
findPendingCompanies() {
  return this.companyService.findPendingCompanies();
}

@Patch(':id/verify')
@Roles('admin')
@ApiOperation({ summary: 'Approve a company (admin only)' })
@ApiResponse({
  status: 200,
  description: 'Company verified successfully',
})
@ApiResponse({
  status: 404,
  description: 'Company not found',
})
@ApiResponse({
  status: 409,
  description: 'Company is already verified',
})
verifyCompany(
  @Param('id', ParseUUIDPipe) id: string,
) {
  return this.companyService.verifyCompany(id);
}

@Patch(':id/reject')
@Roles('admin')
@ApiOperation({ summary: 'Reject a company (admin only)' })
@ApiResponse({
  status: 200,
  description: 'Company rejected successfully',
})
@ApiResponse({
  status: 404,
  description: 'Company not found',
})
@ApiResponse({
  status: 409,
  description: 'Company is already rejected',
})
rejectCompany(
  @Param('id', ParseUUIDPipe) id: string,
) {
  return this.companyService.rejectCompany(id);
}

  @Delete(':id')
  @Roles('employer')
  @ApiOperation({ summary: 'Delete your company (owner only)' })
  @ApiResponse({
    status: 200,
    description: 'Company deleted successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'You are not the owner of this company',
  })
  @ApiResponse({
    status: 404,
    description: 'Company not found',
  })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.companyService.remove(id, req.user.sub);
  }
}
