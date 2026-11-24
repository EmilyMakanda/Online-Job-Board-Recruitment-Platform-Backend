import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsSelect } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../authentication/entities/user.entity.js';
import { Company } from '../company/entities/company.entity.js';
import { AdminAuditService } from '../admin/admin-audit.service.js';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UpdateUserRoleDto } from './dto/update-user-role.dto.js';
import { UpdateUserStatusDto } from './dto/update-user-status.dto.js';

const PUBLIC_USER_FIELDS: FindOptionsSelect<User> = {
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
  createdAt: true,
};

const ADMIN_USER_FIELDS: FindOptionsSelect<User> = {
  ...PUBLIC_USER_FIELDS,
  isActive: true,
  updatedAt: true,
};

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    private readonly adminAuditService: AdminAuditService,
  ) {}

  getAdminUsers(pagination: PaginationQueryDto) {
    return this.userRepository.find({
      select: ADMIN_USER_FIELDS,
      order: { id: 'ASC' },
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
    });
  }

  async getAdminUserById(id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
      select: ADMIN_USER_FIELDS,
    });
    if (!user) {
      throw new NotFoundException('User account not found.');
    }
    return user;
  }

  async getAdminEmployers(pagination: PaginationQueryDto) {
    const employers = await this.userRepository.find({
      where: { role: 'employer' },
      select: ADMIN_USER_FIELDS,
      order: { id: 'ASC' },
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
    });
    const companies = employers.length
      ? await this.companyRepository.find({
          where: employers.map((employer) => ({ employerId: employer.id })),
        })
      : [];
    const companiesByEmployer = new Map(
      companies.map((company) => [company.employerId, company]),
    );
    return employers.map((employer) => ({
      ...employer,
      company: companiesByEmployer.get(employer.id) ?? null,
    }));
  }

  async getAdminEmployerById(id: number) {
    const employer = await this.userRepository.findOne({
      where: { id, role: 'employer' },
      select: ADMIN_USER_FIELDS,
    });
    if (!employer) {
      throw new NotFoundException('Employer account not found.');
    }
    const company = await this.companyRepository.findOneBy({
      employerId: employer.id,
    });
    return { ...employer, company: company ?? null };
  }

  async updateAdminUserStatus(
    id: number,
    actorId: number,
    dto: UpdateUserStatusDto,
  ) {
    if (id === actorId && dto.isActive === 0) {
      throw new ForbiddenException(
        'Administrators cannot deactivate themselves.',
      );
    }

    const message = await this.userRepository.manager.transaction(async (manager) => {
      const users = manager.getRepository(User);
      const target = await users.findOne({ where: { id } });
      if (!target) {
        throw new NotFoundException('User account not found.');
      }

      if (
        target.role === 'admin' &&
        target.isActive === 1 &&
        dto.isActive === 0
      ) {
        const activeAdmins = await users.find({
          where: { role: 'admin', isActive: 1 },
          select: { id: true },
          lock: { mode: 'pessimistic_write' },
        });
        if (activeAdmins.length <= 1) {
          throw new ConflictException(
            'The last active administrator cannot be deactivated.',
          );
        }
      }

      const from = target.isActive;
      target.isActive = dto.isActive;
      await users.save(target);
      await this.adminAuditService.write(manager, {
        actorId,
        action: dto.isActive === 1 ? 'user.activate' : 'user.deactivate',
        targetType: 'user',
        targetId: String(id),
        details: { from, to: dto.isActive },
      });

      return `User account ${dto.isActive === 1 ? 'activated' : 'deactivated'} successfully.`;
    });
    return { message, user: await this.getAdminUserById(id) };
  }

  async updateAdminUserRole(
    id: number,
    actorId: number,
    dto: UpdateUserRoleDto,
  ) {
    if (id === actorId) {
      throw new ForbiddenException(
        'Administrators cannot change their own role.',
      );
    }

    await this.userRepository.manager.transaction(async (manager) => {
      const users = manager.getRepository(User);
      const target = await users.findOne({ where: { id } });
      if (!target) {
        throw new NotFoundException('User account not found.');
      }

      if (
        target.role === 'admin' &&
        target.isActive === 1 &&
        dto.role !== 'admin'
      ) {
        const activeAdmins = await users.find({
          where: { role: 'admin', isActive: 1 },
          select: { id: true },
          lock: { mode: 'pessimistic_write' },
        });
        if (activeAdmins.length <= 1) {
          throw new ConflictException(
            'The last active administrator cannot be demoted.',
          );
        }
      }

      const from = target.role;
      target.role = dto.role;
      await users.save(target);
      await this.adminAuditService.write(manager, {
        actorId,
        action: 'user.role.update',
        targetType: 'user',
        targetId: String(id),
        details: { from, to: dto.role },
      });

    });
    return {
      message: 'User role updated successfully.',
      user: await this.getAdminUserById(id),
    };
  }

  async createUser(dto: CreateUserDto) {
    const existing = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const { password, ...rest } = dto;
    const passwordHash = await bcrypt.hash(password, 10);

    const user = this.userRepository.create({
      ...rest,
      password: passwordHash,
      role: 'job_seeker',
    });

    const saved = await this.userRepository.save(user);
    return this.userRepository.findOneByOrFail({ id: saved.id });
  }

  async findUser(id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
      select: PUBLIC_USER_FIELDS,
    });
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string) {
    return this.userRepository.findOneBy({ email });
  }

  async updateUser(id: number, dto: UpdateUserDto) {
    const user = await this.findUser(id);

    const { name, phone, location, resumeUrl, skills } = dto;
    Object.assign(user, { name, phone, location, resumeUrl, skills });

    return this.userRepository.save(user);
  }

  async removeUser(id: number) {
    const user = await this.findUser(id);
    if (user.role === 'admin') {
      throw new ForbiddenException(
        'Administrator accounts cannot be deleted through self-service.',
      );
    }
    await this.userRepository.remove(user);

    return { message: `User with ID ${id} deleted successfully` };
  }
}
