
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { User } from '../authentication/entities/user.entity.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // Get all users
  async findAll() {
    return this.userRepository.find({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isEmailVerified: true,
        createdAt: true,
      },
    });
  }

  // Get all job seekers
  async findAllJobseekers() {
    return this.userRepository.find({
      where: { role: 'job_seeker' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isEmailVerified: true,
        createdAt: true,
      },
    });
  }

  // Get all employers
  async findAllEmployers() {
    return this.userRepository.find({
      where: { role: 'employer' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isEmailVerified: true,
        createdAt: true,
      },
    });
  }

  // Get one user by ID
  async findOne(id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isEmailVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  // Update a user's name or email
  async update(
    id: number,
    data: { name?: string; email?: string },
  ) {
    const user = await this.userRepository.findOneBy({ id });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    if (data.email && data.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: data.email },
      });

      if (existingUser) {
        throw new ConflictException('Email is already registered');
      }

      user.email = data.email;
      // Require email verification again after changing email.
      user.isEmailVerified = 0;
    }

    if (data.name !== undefined) {
      user.name = data.name;
    }

    return this.userRepository.save(user).then((saved) => ({
      id: saved.id,
      name: saved.name,
      email: saved.email,
      role: saved.role,
      isEmailVerified: saved.isEmailVerified,
      createdAt: saved.createdAt,
    }));
  }

  // Delete a user
  async remove(id: number) {
    const user = await this.userRepository.findOneBy({ id });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    await this.userRepository.remove(user);

    return {
      message: `User with ID ${id} deleted successfully`,
    };
  }
}
