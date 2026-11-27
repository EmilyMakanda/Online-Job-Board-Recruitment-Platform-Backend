import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, FindOptionsSelect } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../authentication/entities/user.entity.js';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';
import { paginated, paginationOptions } from '../common/pagination.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { Application } from '../applications/entities/application.entity.js';
import { ApplicationDocument } from '../applications/entities/application-document.entity.js';
import { removeApplicationFiles } from '../applications/application-file-storage.js';
import { Company } from '../company/entities/company.entity.js';

const PUBLIC_USER_FIELDS: FindOptionsSelect<User> = {
  id: true,
  name: true,
  email: true,
  phone: true,
  location: true,
  resumeUrl: true,
  skills: true,
  role: true,
  isEmailVerified: true,
  createdAt: true,
};

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

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

  async findAllUsers(
    pagination: PaginationQueryDto = new PaginationQueryDto(),
  ) {
    const result = await this.userRepository.findAndCount({
      select: PUBLIC_USER_FIELDS,
      ...paginationOptions(pagination),
    });
    return paginated(result, pagination);
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
    const documents = await this.dataSource
      .getRepository(ApplicationDocument)
      .createQueryBuilder('document')
      .innerJoin('document.application', 'application')
      .leftJoin('application.job', 'job')
      .leftJoin('job.postedBy', 'poster')
      .where('application.jobSeekerId = :id', { id })
      .orWhere('poster.id = :id', { id })
      .select(['document.storedName'])
      .getMany();

    await this.dataSource.transaction(async (manager) => {
      const users = manager.getRepository(User);
      const user = await users.findOne({
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!user) {
        throw new NotFoundException(`User with id ${id} not found`);
      }

      const company = await manager
        .getRepository(Company)
        .findOneBy({ employerId: id });
      await manager.getRepository(Application).delete({ jobSeekerId: id });
      await users.remove(user);

      if (company) {
        await manager.getRepository(Company).delete({
          companyId: company.companyId,
        });
      }
    });

    removeApplicationFiles(documents.map(({ storedName }) => storedName));

    return { message: `User with ID ${id} deleted successfully` };
  }

  async deactivateUser(id: number, requesterId: number) {
    if (id === requesterId) {
      throw new ForbiddenException(
        'Administrators cannot deactivate their own account.',
      );
    }

    const user = await this.userRepository.findOne({
      where: { id },
      select: { id: true, isActive: true },
    });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    user.isActive = 0;
    await this.userRepository.save(user);

    return { message: `User with ID ${id} deactivated successfully` };
  }

  async activateUser(id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
      select: { id: true, isActive: true },
    });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    user.isActive = 1;
    await this.userRepository.save(user);

    return { message: `User with ID ${id} activated successfully` };
  }

    async updateUserRole(
    id: number,
    newRole: 'job_seeker' | 'employer' | 'admin',
    requesterId: number,
  ) {
    if (id === requesterId) {
      throw new ForbiddenException(
        'Administrators cannot change their own role.',
      );
    }

    const user = await this.userRepository.findOne({
      where: { id },
      select: { id: true, role: true },
    });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    if (user.role === newRole) {
      throw new ConflictException(
        `User already has the ${newRole} role.`,
      );
    }

    const result = await this.userRepository.update(
      { id, role: user.role },
      { role: newRole },
    );

    if (result.affected === 0) {
      throw new ConflictException(
        'The user role has changed. Please refresh and try again.',
      );
    }

    return {
      message: `User with ID ${id} successfully changed from ${user.role} to ${newRole}.`,
      user: await this.findUser(id),
    };
  }
}
