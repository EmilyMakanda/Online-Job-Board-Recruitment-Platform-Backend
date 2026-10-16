import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Jobseeker } from './entities/jobseeker.entity.js';
import { Employer } from './entities/employer.entity.js';
import { CreateJobSeekerDto } from './dto/create-jobseeker.dto.js';
import { CreateEmployerDto } from './dto/create-employer.dto.js';
import { UpdateJobSeekerDto } from './dto/update-jobseeker.dto.js';
import { UpdateEmployerDto } from './dto/update-employer.dto.js';

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

  async findAllJobseekers() {
    return this.jobseekerRepo.find();
  }

  async findJobseeker(id: number) {
    const jobseeker = await this.jobseekerRepo.findOneBy({ id });
    if (!jobseeker) {
      throw new NotFoundException(`Jobseeker with id ${id} not found`);
    }
    return jobseeker;
  }

  async findAllEmployers() {
    return this.employerRepo.find();
  }

  async findEmployer(id: number) {
    const employer = await this.employerRepo.findOneBy({ id });
    if (!employer) {
      throw new NotFoundException(`Employer with id ${id} not found`);
    }
    return employer;
  }

  async updateJobseeker(id: number, dto: UpdateJobSeekerDto) {
    const jobseeker = await this.findJobseeker(id);

    if (dto.email && dto.email !== jobseeker.email) {
      const taken = await this.jobseekerRepo.findOneBy({ email: dto.email });
      if (taken) {
        throw new ConflictException('Email already registered');
      }
    }

    const { dateOfBirth, ...rest } = dto;
    Object.assign(jobseeker, rest);
    if (dateOfBirth) {
      jobseeker.dateOfBirth = new Date(dateOfBirth);
    }

    return this.jobseekerRepo.save(jobseeker);
  }

  async removeJobseeker(id: number) {
    const jobseeker = await this.findJobseeker(id);
    await this.jobseekerRepo.remove(jobseeker);
  }

  async updateEmployer(id: number, dto: UpdateEmployerDto) {
    const employer = await this.findEmployer(id);

    if (dto.email && dto.email !== employer.email) {
      const taken = await this.employerRepo.findOneBy({ email: dto.email });
      if (taken) {
        throw new ConflictException('Email already registered');
      }
    }
    Object.assign(employer, dto);
    return this.employerRepo.save(employer);
  }

  async removeEmployer(id: number) {
    const employer = await this.findEmployer(id);
    await this.employerRepo.remove(employer);
  }
}
