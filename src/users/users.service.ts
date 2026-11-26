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
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';

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
    return this.userRepository.find({
      select: PUBLIC_USER_FIELDS,
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
    });
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
    await this.userRepository.remove(user);

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
