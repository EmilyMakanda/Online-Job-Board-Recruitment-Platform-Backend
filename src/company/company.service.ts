
import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import {
  Company,
  VerificationStatus,
} from './entities/company.entity.js';
import { User } from '../authentication/entities/user.entity.js';
import { CreateCompanyDto } from './dto/create-company.dto.js';
import { UpdateCompanyDto } from './dto/update-company.dto.js';
import { ApplicationDocument } from '../applications/entities/application-document.entity.js';
import { removeApplicationFiles } from '../applications/application-file-storage.js';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';
import { paginated, paginationOptions } from '../common/pagination.js';
import { Job } from '../jobs/entities/jobs.entity.js';

@Injectable()
export class CompanyService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    employerId: number,
    createCompanyDto: CreateCompanyDto,
  ): Promise<Company> {
    // Check that the employer exists.
    const employer = await this.userRepository.findOneBy({
      id: employerId,
    });

    if (!employer) {
      throw new NotFoundException('Employer user does not exist');
    }

    // Check whether this employer already owns a company.
    const existingCompany = await this.companyRepository.findOneBy({
      employerId,
    });

    if (existingCompany) {
      throw new ConflictException(
        'This employer already has a registered company',
      );
    }

    // Normalize the registration number before checking for duplicates.
    const registrationNumber =
      createCompanyDto.registrationNumber.trim().toUpperCase();

    const existingRegistration = await this.companyRepository.findOneBy({
      registrationNumber,
    });

    if (existingRegistration) {
      throw new ConflictException(
        'A company with this registration number already exists',
      );
    }

    // Create the company with pending verification status.
    const company = this.companyRepository.create({
      ...createCompanyDto,
      registrationNumber,
      employerId,
    });

    return this.companyRepository.save(company);
  }

  async findAll(pagination: PaginationQueryDto) {
    const result = await this.companyRepository.findAndCount({
      order: { createdAt: 'DESC' },
      ...paginationOptions(pagination),
    });
    return paginated(result, pagination);
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

    // Ensure the requester owns this company.
    if (company.employerId !== requesterId) {
      throw new ForbiddenException(
        'You can only edit your own company',
      );
    }

    // Reject an empty update request.
    if (Object.keys(updateCompanyDto).length === 0) {
      throw new BadRequestException(
        'Provide at least one field to update',
      );
    }

    // Apply only fields supplied in the update DTO.
    const updates = Object.fromEntries(
      Object.entries(updateCompanyDto).filter(
        ([, value]) => value !== undefined,
      ),
    );

    Object.assign(company, updates);

    return this.companyRepository.save(company);
  }

  async findPendingCompanies(pagination: PaginationQueryDto) {
    const result = await this.companyRepository.findAndCount({
      where: {
        verificationStatus: VerificationStatus.PENDING,
      },
      order: {
        createdAt: 'ASC',
      },
      ...paginationOptions(pagination),
    });
    return paginated(result, pagination);
  }

  async verifyCompany(companyId: string): Promise<Company> {
    const company = await this.findOne(companyId);

    // Only pending companies can be verified.
    if (company.verificationStatus !== VerificationStatus.PENDING) {
      throw new ConflictException(
        'Only pending companies can be verified',
      );
    }

    company.verificationStatus = VerificationStatus.VERIFIED;
    company.verifiedAt = new Date();

    return this.companyRepository.save(company);
  }

  async rejectCompany(companyId: string): Promise<Company> {
    const company = await this.findOne(companyId);

    // Only pending companies can be rejected.
    if (company.verificationStatus !== VerificationStatus.PENDING) {
      throw new ConflictException(
        'Only pending companies can be rejected',
      );
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
    if (company.employerId !== requesterId) {
      throw new ForbiddenException(
        'You can only delete your own company',
      );
    }

    const documents = await this.dataSource
      .getRepository(ApplicationDocument)
      .createQueryBuilder('document')
      .innerJoin('document.application', 'application')
      .innerJoin('application.job', 'job')
      .innerJoin('job.company', 'company')
      .where('company.companyId = :companyId', { companyId })
      .select(['document.storedName'])
      .getMany();

    await this.dataSource.transaction(async (manager) => {
      const companies = manager.getRepository(Company);
      const currentCompany = await companies.findOne({
        where: { companyId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!currentCompany) {
        throw new NotFoundException(
          `Company with ID ${companyId} was not found`,
        );
      }
      if (currentCompany.employerId !== requesterId) {
        throw new ForbiddenException(
          'You can only delete your own company',
        );
      }

      await manager
        .getRepository(Job)
        .createQueryBuilder()
        .delete()
        .from(Job)
        .where('company_id = :companyId', { companyId })
        .execute();
      await companies.remove(currentCompany);
    });

    removeApplicationFiles(documents.map(({ storedName }) => storedName));
  }
}
