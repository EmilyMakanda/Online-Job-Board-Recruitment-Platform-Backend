
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';

import { CompanyService } from './company.service.js';
import { CreateCompanyDto } from './dto/create-company.dto.js';
import { UpdateCompanyDto } from './dto/update-company.dto.js';

@ApiTags('Companies')
@Controller('companies')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Post()
  @ApiOperation({ summary: 'Register a company' })
  @ApiResponse({ status: 201, description: 'Company registered successfully' })
  create(@Body() createCompanyDto: CreateCompanyDto) {
    return this.companyService.create(createCompanyDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all companies' })
  findAll() {
    return this.companyService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a company by ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.companyService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a company' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCompanyDto: UpdateCompanyDto,
  ) {
    return this.companyService.update(id, updateCompanyDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a company' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.companyService.remove(id);
  }
}
