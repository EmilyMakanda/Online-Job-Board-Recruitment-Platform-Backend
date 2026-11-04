
import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Company } from '../company/entities/company.entity.js';
import { UpdateCompanyVerificationDto } from './dto/update-company-verification.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '../authentication/entities/user.entity.js';
import { UpdateUserStatusDto } from './dto/update-user-status.dto.js';
@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
   
  @InjectRepository(Company)
  private readonly companyRepository: Repository<Company>,
  ) {}
async getAllCompanies() {
  const currentUser = await this.companyRepository.query(
  'SELECT USER AS CURRENT_USER FROM DUAL',
);

console.log('NESTJS ORACLE USER:', currentUser);
  // Test the database connection used by NestJS
  const rawResult = await this.companyRepository.query(
    'SELECT COUNT(*) AS TOTAL FROM "companies"',
  );

  console.log('RAW COMPANY COUNT:', rawResult);

  // Check TypeORM entity mapping
  console.log(
    'COMPANY TABLE:',
    this.companyRepository.metadata.tablePath,
  );

  console.log(
    'COMPANY COLUMN MAPPING:',
    this.companyRepository.metadata.columns.map((column) => ({
      property: column.propertyName,
      databaseColumn: column.databaseName,
    })),
  );

  // Test the normal TypeORM query
  const companies = await this.companyRepository.find();

  console.log('TYPEORM COMPANIES:', companies);

  return companies;
}

async getPendingCompanies() {
  return this.companyRepository
    .createQueryBuilder('company')
    .select([
      'company.companyId',
      'company.companyName',
      'company.description',
      'company.website',
      //'company.location',
      'company.employerId',
      'company.verificationStatus',
      //'company.createdAt',
    ])
    .where('company.verificationStatus = :status', {
      status: 'pending',
    })
    .orderBy('company.companyName', 'DESC')
    .getMany();
}

async updateCompanyVerification(
  id: number,
  dto: UpdateCompanyVerificationDto,
) {
  const company = await this.companyRepository.findOneBy({
    companyId: id,
  });

  if (!company) {
    throw new NotFoundException(`Company with ID ${id} was not found`);
  }

  company.verificationStatus = dto.verificationStatus;
  company.verifiedAt =
    dto.verificationStatus === 'verified' ? new Date() : null;

  await this.companyRepository.save(company);

  return {
    message: 'Company verification status updated successfully',
    company: {
      companyId: company.companyId,
      companyName: company.companyName,
      employerId: company.employerId,
      verificationStatus: company.verificationStatus,
      verifiedAt: company.verifiedAt,
    },
  };
}
async updateUserStatus(
  id: number,
  updateUserStatusDto: UpdateUserStatusDto,
) {
  const user = await this.userRepository.findOneBy({ id });

  if (!user) {
    throw new NotFoundException(
      `User with ID ${id} was not found`,
    );
  }

  user.isActive = updateUserStatusDto.isActive;

  await this.userRepository.save(user);

  return {
    message: 'User account status updated successfully',
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    },
  };
}

  // Get all registered users
  async getAllUsers() {
    return this.userRepository
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.name',
        'user.email',
        'user.role',
        'user.isEmailVerified',
        'user.createdAt',
      ])
      .orderBy('user.createdAt', 'DESC')
      .getMany();
  }

  // Get one user by ID
  async getUserById(id: number) {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.name',
        'user.email',
        'user.role',
        'user.isEmailVerified',
        'user.createdAt',
      ])
      .where('user.id = :id', { id })
      .getOne();

    if (!user) {
      throw new NotFoundException(
        `User with ID ${id} was not found`,
      );
    }

    return user;
  }
}
