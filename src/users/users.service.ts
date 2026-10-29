import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../authentication/entities/user.entity.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';

@Injectable()
export class UsersService {
  findAll(): any {
    throw new Error('Method not implemented.');
  }
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
    return this.userRepository.find();
  }

  async findUser(id: number) {
    const user = await this.userRepository.findOneBy({ id });
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
  }
}