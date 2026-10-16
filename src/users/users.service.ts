import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Jobseeker } from './entities/jobseeker.entity.js';
import { Employer } from './entities/employer.entity.js';
import { CreateJobSeekerDto } from './dto/create-jobseeker.dto.js';
import { CreateEmployerDto } from './dto/create-employer.dto.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Jobseeker)
    private readonly jobseekerRepo: Repository<Jobseeker>,
    @InjectRepository(Employer)
    private readonly employerRepo: Repository<Employer>,
  ) {}

  async createJobseeker(dto: CreateJobSeekerDto) {
    const existing = await this.jobseekerRepo.findOne({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const { password, dateOfBirth, ...rest } = dto;
    const jobseeker = this.jobseekerRepo.create({
      ...rest,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      passwordHash: await bcrypt.hash(password, 10),
    });

    const saved = await this.jobseekerRepo.save(jobseeker);
    return this.jobseekerRepo.findOneByOrFail({ id: saved.id });
  }

  async createEmployer(dto: CreateEmployerDto) {
    const existing = await this.employerRepo.findOne({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }
    const { password, ...rest } = dto;
    const employer = this.employerRepo.create({
      ...rest,
      role: 'employer',
      passwordHash: await bcrypt.hash(password, 10),
    });

    const saved = await this.employerRepo.save(employer);
    return this.employerRepo.findOneByOrFail({ id: saved.id });
  }
}
