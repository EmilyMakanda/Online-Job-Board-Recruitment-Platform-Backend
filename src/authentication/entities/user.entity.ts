import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  type Relation,
} from 'typeorm';
import { Company } from '../../company/entities/company.entity.js';
import { Job } from '../../jobs/entities/jobs.entity.js';
import { type UserRole } from '../roles.decorator.js';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar2', length: 100 })
  name: string;

  @Column({ type: 'varchar2', length: 150, unique: true })
  email: string;

  @Column({ type: 'varchar2', length: 20, nullable: true })
  phone: string | null;

  @Column({type: 'varchar2',length: 255, nullable: true })
  resumeUrl: string | null;

  @Column({type: 'varchar2', length: 100, nullable: true })
  location: string | null;

  @Column({type: 'varchar2', length: 1000, nullable: true })
  skills: string | null;

  @Column({
    type: 'varchar2',
    length: 255,
    select: false,
  })
  password: string;

  // Differentiates job seekers from employers
  @Column({
    type: 'varchar2',
    length: 20,
    default: 'job_seeker',
  })
  role: UserRole;

  @Column({
    name: 'COMPANY_ID',
    type: 'number',
    nullable: true,
  })
  companyId: number | null;

  @ManyToOne(() => Company, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'COMPANY_ID' })
  company: Relation<Company> | null;

  @Column({ type: 'number', default: 0 })
  isEmailVerified: number;

  @OneToMany(()=> Job, (job) => job.postedBy)
  jobs:Relation<Job[]>;

  @Column({
    type: 'varchar2',
    length: 64,
    nullable: true,
  })
  emailVerificationTokenHash: string | null;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  emailVerificationTokenExpiresAt: Date | null;

  @Column({
    name: 'IS_ACTIVE',
    type: 'number',
    default: 1,
  })
  isActive: number;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}