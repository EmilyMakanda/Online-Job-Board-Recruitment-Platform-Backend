
import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { 
  Company,
  VerificationStatus,
 } from './entities/company.entity.js';
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

  async create(
    employerId: number,
    createCompanyDto: CreateCompanyDto,
  ): Promise<Company> {
    // Check that the employer exists
    const employer = await this.userRepository.findOneBy({
      id: employerId,
    });

    if (!employer) {
      throw new NotFoundException('Employer user does not exist');
    }

    // Check whether this employer already owns a company
    const existingCompany = await this.companyRepository.findOneBy({
      employerId,
    });

    if (existingCompany) {
      throw new ConflictException(
        'This employer already has a registered company',
      );
    }

    // Check whether the registration number is already registered
    const existingRegistration = await this.companyRepository.findOneBy({
      registrationNumber: createCompanyDto.registrationNumber,
    });

    if (existingRegistration) {
      throw new ConflictException(
        'A company with this registration number already exists',
      );
    }

    // Create the company with pending verification status
    const company = this.companyRepository.create({
      ...createCompanyDto,
      employerId,
    });

    return this.companyRepository.save(company);
  }

  async findAll(): Promise<Company[]> {
    return this.companyRepository.find();
  }

  async findOne(companyId: string): Promise<Company> {
    const company = await this.companyRepository.findOneBy({
      companyId,
    });

    if (!company) {
      throw new NotFoundException(
        `Company with ID ${companyId} was not found`,
      );
    }

    return company;
  }

  async update(
    companyId: string,
    requesterId: number,
    updateCompanyDto: UpdateCompanyDto,
  ): Promise<Company> {
    const company = await this.findOne(companyId);

    // Ensure the requester owns this company
    if (company.employerId !== requesterId) {
      throw new ForbiddenException(
        'You can only edit your own company',
      );
    }

    // Apply only fields supplied in the update DTO
    const updates = Object.fromEntries(
      Object.entries(updateCompanyDto).filter(
        ([, value]) => value !== undefined,
      ),
    );

    Object.assign(company, updates);

    return this.companyRepository.save(company);
  }

  async findPendingCompanies(): Promise<Company[]> {
  return this.companyRepository.find({
    where: {
      verificationStatus: VerificationStatus.PENDING,
    },
    order: {
      createdAt: 'ASC',
    },
  });
}

async verifyCompany(companyId: string): Promise<Company> {
  const company = await this.findOne(companyId);

  if (company.verificationStatus === VerificationStatus.VERIFIED) {
    throw new ConflictException('Company is already verified');
  }

  company.verificationStatus = VerificationStatus.VERIFIED;
  company.verifiedAt = new Date();

  return this.companyRepository.save(company);
}

async rejectCompany(companyId: string): Promise<Company> {
  const company = await this.findOne(companyId);

  if (company.verificationStatus === VerificationStatus.REJECTED) {
    throw new ConflictException('Company is already rejected');
  }

  company.verificationStatus = VerificationStatus.REJECTED;
  company.verifiedAt = null;

  return this.companyRepository.save(company);
}

  async remove(
    companyId: string,
    requesterId: number,
  ): Promise<void> {
    const company = await this.findOne(companyId);

    // Ensure the requester owns this company
    if (company.employerId !== requesterId) {
      throw new ForbiddenException(
        'You can only delete your own company',
      );
    }

    await this.companyRepository.remove(company);
  }
}
