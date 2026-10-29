
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Company } from './entities/company.entity.js';
import { User } from '../authentication/entities/user.entity.js';
import { CreateCompanyDto } from './dto/create-company.dto.js';
import { UpdateCompanyDto } from './dto/update-company.dto.js';

@Injectable()
export class CompanyService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createCompanyDto: CreateCompanyDto): Promise<Company> {
    const employer = await this.userRepository.findOneBy({
      id: createCompanyDto.employerId,
    });

    if (!employer) {
      throw new BadRequestException('Employer user does not exist');
    }

    const existingCompany = await this.companyRepository.findOneBy({
      employerId: createCompanyDto.employerId,
    });

    if (existingCompany) {
      throw new ConflictException(
        'This employer already has a registered company',
      );
    }

    const company = this.companyRepository.create(createCompanyDto);

    return this.companyRepository.save(company);
  }

  async findAll(): Promise<Company[]> {
    return this.companyRepository.find();
  }

  async findOne(companyId: number): Promise<Company> {
    const company = await this.companyRepository.findOneBy({ companyId });

    if (!company) {
      throw new NotFoundException(
        `Company with ID ${companyId} was not found`,
      );
    }

    return company;
  }

  async update(
    companyId: number,
    updateCompanyDto: UpdateCompanyDto,
  ): Promise<Company> {
    const company = await this.findOne(companyId);
    
    const updates = Object.fromEntries(
      Object.entries(updateCompanyDto).filter(
        ([key, value]) => key !== 'employerId' && value !== undefined,
      ),
    );

    Object.assign(company, updates);

    return this.companyRepository.save(company);
  }

  async remove(companyId: number): Promise<void> {
    const company = await this.findOne(companyId);

    await this.companyRepository.remove(company);
  }
}
