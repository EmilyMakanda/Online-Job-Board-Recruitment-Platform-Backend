import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Company } from './entities/company.entity.js';
import { User } from '../authentication/entities/user.entity.js';
import { Job, JobStatus } from '../jobs/entities/jobs.entity.js';
import { AdminAuditService } from '../admin/admin-audit.service.js';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';
import { UpdateCompanyVerificationDto } from '../admin/dto/update-company-verification.js';
import { CreateCompanyDto } from './dto/create-company.dto.js';
import { UpdateCompanyDto } from './dto/update-company.dto.js';

@Injectable()
export class CompanyService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,

    private readonly adminAuditService: AdminAuditService,
  ) {}

  getAdminCompanies(pagination: PaginationQueryDto) {
    return this.companyRepository.find({
      order: { companyId: 'ASC' },
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
    });
  }

  getAdminPendingCompanies(pagination: PaginationQueryDto) {
    return this.companyRepository.find({
      where: { verificationStatus: 'pending' },
      order: { companyId: 'ASC' },
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
    });
  }

  async updateAdminVerification(
    companyId: number,
    actorId: number,
    dto: UpdateCompanyVerificationDto,
  ) {
    return this.companyRepository.manager.transaction(async (manager) => {
      const companies = manager.getRepository(Company);
      const company = await companies.findOne({ where: { companyId } });
      if (!company) {
        throw new NotFoundException(
          `Company with ID ${companyId} was not found`,
        );
      }

      const from = company.verificationStatus;
      company.verificationStatus = dto.verificationStatus;
      company.verifiedAt =
        dto.verificationStatus === 'verified' ? new Date() : null;
      await companies.save(company);

      if (dto.verificationStatus === 'rejected') {
        const jobs = manager.getRepository(Job);
        const approvedJobs = await jobs.find({
          where: { company: { companyId }, status: JobStatus.APPROVED },
        });
        if (approvedJobs.length) {
          await jobs.save(
            approvedJobs.map((job) => ({ ...job, status: JobStatus.REJECTED })),
          );
        }
      }

      await this.adminAuditService.write(manager, {
        actorId,
        action: 'company.verification.update',
        targetType: 'company',
        targetId: String(companyId),
        details: {
          from,
          to: dto.verificationStatus,
          revokedApprovedJobs: dto.verificationStatus === 'rejected',
        },
      });

      return {
        message: 'Company verification status updated successfully.',
        company,
      };
    });
  }

  async create(
    employerId: number,
    createCompanyDto: CreateCompanyDto,
  ): Promise<Company> {
    const employer = await this.userRepository.findOneBy({ id: employerId });

    if (!employer) {
      throw new BadRequestException('Employer user does not exist');
    }

    const existingCompany = await this.companyRepository.findOneBy({
      employerId,
    });

    if (existingCompany) {
      throw new ConflictException(
        'This employer already has a registered company',
      );
    }

    const company = this.companyRepository.create({
      ...createCompanyDto,
      employerId,
    });
    const saved = await this.companyRepository.save(company);

    await this.userRepository.update(employerId, {
      companyId: saved.companyId,
    });

    return saved;
  }

  async findAll(): Promise<Company[]> {
    return this.companyRepository.find();
  }

  async findOne(companyId: number): Promise<Company> {
    const company = await this.companyRepository.findOneBy({ companyId });

    if (!company) {
      throw new NotFoundException(`Company with ID ${companyId} was not found`);
    }

    return company;
  }

  async update(
    companyId: number,
    requesterId: number,
    updateCompanyDto: UpdateCompanyDto,
  ): Promise<Company> {
    const company = await this.findOne(companyId);

    if (company.employerId !== requesterId) {
      throw new ForbiddenException('You can only edit your own company');
    }

    const updates = Object.fromEntries(
      Object.entries(updateCompanyDto).filter(
        ([, value]) => value !== undefined,
      ),
    );

    Object.assign(company, updates);

    return this.companyRepository.save(company);
  }

  async remove(companyId: number, requesterId: number): Promise<void> {
    const company = await this.findOne(companyId);

    if (company.employerId !== requesterId) {
      throw new ForbiddenException('You can only delete your own company');
    }

    await this.companyRepository.remove(company);
    await this.userRepository.update(requesterId, { companyId: null });
  }
}