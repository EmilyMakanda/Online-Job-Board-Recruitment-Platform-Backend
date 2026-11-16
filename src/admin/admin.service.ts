import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { Application } from '../applications/entities/application.entity.js';
import { Company } from '../company/entities/company.entity.js';
import { User } from '../authentication/entities/user.entity.js';
import { Job, JobStatus } from '../jobs/entities/jobs.entity.js';
import { Report } from '../reports/entities/report.entity.js';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';
import { UpdateCompanyVerificationDto } from './dto/update-company-verification.js';
import { UpdateReportStatusDto } from './dto/update-report-status.dto.js';
import { UpdateUserStatusDto } from './dto/update-user-status.dto.js';

const ADMIN_USER_FIELDS = {
  id: true,
  name: true,
  email: true,
  phone: true,
  location: true,
  resumeUrl: true,
  skills: true,
  role: true,
  companyId: true,
  isEmailVerified: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
    @InjectRepository(Application)
    private readonly applicationRepository: Repository<Application>,
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
  ) {}

  getAllUsers(pagination: PaginationQueryDto = new PaginationQueryDto()) {
    return this.userRepository.find({
      select: ADMIN_USER_FIELDS,
      order: { createdAt: 'DESC' },
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
    });
  }

  async getUserById(id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
      select: ADMIN_USER_FIELDS,
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} was not found`);
    }
    return user;
  }

  async activateUser(id: number) {
    return this.setUserActiveState(id, 1);
  }

  async deactivateUser(id: number, requesterId: number) {
    if (id === requesterId) {
      throw new ForbiddenException(
        'Administrators cannot deactivate their own account.',
      );
    }
    return this.setUserActiveState(id, 0);
  }

  async updateUserStatus(
    id: number,
    requesterId: number,
    dto: UpdateUserStatusDto,
  ) {
    if (dto.isActive === 0 && id === requesterId) {
      throw new ForbiddenException(
        'Administrators cannot deactivate their own account.',
      );
    }
    return this.setUserActiveState(id, dto.isActive);
  }

  private async setUserActiveState(id: number, isActive: number) {
    const user = await this.userRepository.findOne({
      where: { id },
      select: ADMIN_USER_FIELDS,
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} was not found`);
    }

    user.isActive = isActive;
    await this.userRepository.save(user);
    return {
      message: isActive
        ? 'User account activated successfully.'
        : 'User account deactivated successfully.',
      user,
    };
  }

  async getAllEmployers(
    pagination: PaginationQueryDto = new PaginationQueryDto(),
  ) {
    const employers = await this.userRepository.find({
      where: { role: 'employer' },
      select: ADMIN_USER_FIELDS,
      order: { createdAt: 'DESC' },
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
    });
    if (employers.length === 0) {
      return [];
    }

    const companies = await this.companyRepository.find({
      where: { employerId: In(employers.map((employer) => employer.id)) },
    });
    return employers.map((employer) => ({
      ...employer,
      company:
        companies.find((company) => company.employerId === employer.id) ?? null,
    }));
  }

  async getEmployerById(id: number) {
    const employer = await this.userRepository.findOne({
      where: { id, role: 'employer' },
      select: ADMIN_USER_FIELDS,
    });
    if (!employer) {
      throw new NotFoundException(`Employer with ID ${id} was not found`);
    }

    return {
      ...employer,
      company: await this.companyRepository.findOneBy({ employerId: id }),
    };
  }

  getAllCompanies(pagination: PaginationQueryDto = new PaginationQueryDto()) {
    return this.companyRepository.find({
      order: { createdAt: 'DESC' },
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
    });
  }

  getPendingCompanies(
    pagination: PaginationQueryDto = new PaginationQueryDto(),
  ) {
    return this.companyRepository.find({
      where: { verificationStatus: 'pending' },
      order: { createdAt: 'DESC' },
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
    });
  }

  async updateCompanyVerification(
    id: number,
    dto: UpdateCompanyVerificationDto,
  ) {
    const company = await this.companyRepository.findOneBy({ companyId: id });
    if (!company) {
      throw new NotFoundException(`Company with ID ${id} was not found`);
    }

    company.verificationStatus = dto.verificationStatus;
    company.verifiedAt =
      dto.verificationStatus === 'verified' ? new Date() : null;
    await this.companyRepository.save(company);

    return {
      message: 'Company verification status updated successfully.',
      company,
    };
  }

  getAllJobs(pagination: PaginationQueryDto = new PaginationQueryDto()) {
    return this.jobRepository.find({
      relations: { company: true },
      order: { createdAt: 'DESC' },
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
    });
  }

  approveJob(id: string) {
    return this.setJobStatus(id, JobStatus.APPROVED);
  }

  rejectJob(id: string) {
    return this.setJobStatus(id, JobStatus.REJECTED);
  }

  async removeJob(id: string) {
    const job = await this.jobRepository.findOneBy({ id });
    if (!job) {
      throw new NotFoundException(`Job with ID "${id}" was not found`);
    }

    // Keep application history intact while removing the listing from public search.
    job.status = JobStatus.REMOVED;
    await this.jobRepository.save(job);
    return { message: 'Job posting removed from public listings.', job };
  }

  private async setJobStatus(id: string, status: JobStatus) {
    const job = await this.jobRepository.findOne({
      where: { id },
      relations: { company: true },
    });
    if (!job) {
      throw new NotFoundException(`Job with ID "${id}" was not found`);
    }
    if (job.status === JobStatus.CLOSED) {
      throw new ConflictException('A closed job cannot be moderated.');
    }

    job.status = status;
    return this.jobRepository.save(job);
  }

  getAllApplications(
    pagination: PaginationQueryDto = new PaginationQueryDto(),
  ) {
    return this.applicationRepository.find({
      relations: { job: { company: true } },
      order: { appliedAt: 'DESC' },
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
    });
  }

  async getApplicationById(id: number) {
    const application = await this.applicationRepository.findOne({
      where: { applicationId: id },
      relations: { job: { company: true } },
    });
    if (!application) {
      throw new NotFoundException(`Application with ID ${id} was not found`);
    }
    return application;
  }

  getAllReports(pagination: PaginationQueryDto = new PaginationQueryDto()) {
    return this.reportRepository.find({
      order: { createdAt: 'DESC' },
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
    });
  }

  async updateReportStatus(id: number, dto: UpdateReportStatusDto) {
    const report = await this.reportRepository.findOneBy({ reportId: id });
    if (!report) {
      throw new NotFoundException(`Report with ID ${id} was not found`);
    }

    report.status = dto.status;
    report.resolution = dto.resolution?.trim() || null;
    report.resolvedAt = new Date();
    return this.reportRepository.save(report);
  }

  async getStatistics() {
    const [
      totalUsers,
      totalJobSeekers,
      totalEmployers,
      totalAdministrators,
      totalJobs,
      approvedJobs,
      pendingJobs,
      rejectedJobs,
      totalApplications,
    ] = await Promise.all([
      this.userRepository.count(),
      this.userRepository.count({ where: { role: 'job_seeker' } }),
      this.userRepository.count({ where: { role: 'employer' } }),
      this.userRepository.count({ where: { role: 'admin' } }),
      this.jobRepository.count(),
      this.jobRepository.count({ where: { status: JobStatus.APPROVED } }),
      this.jobRepository.count({ where: { status: JobStatus.PENDING } }),
      this.jobRepository.count({ where: { status: JobStatus.REJECTED } }),
      this.applicationRepository.count(),
    ]);

    return {
      totalUsers,
      totalJobSeekers,
      totalEmployers,
      totalAdministrators,
      totalJobs,
      approvedJobs,
      pendingJobs,
      rejectedJobs,
      totalApplications,
    };
  }
}
