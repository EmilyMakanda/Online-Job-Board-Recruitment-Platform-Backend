import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsSelect } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../authentication/entities/user.entity.js';
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
  companyId: true,
  isEmailVerified: true,
  createdAt: true,
  updatedAt: true,
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

  async findAllUsers() {
    return this.userRepository.find({ select: PUBLIC_USER_FIELDS });
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
}