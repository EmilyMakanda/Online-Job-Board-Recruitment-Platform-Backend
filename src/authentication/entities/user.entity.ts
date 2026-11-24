import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  OneToMany,
  type Relation,
} from 'typeorm';
import { Job } from '../../jobs/entities/jobs.entity.js';
<<<<<<< HEAD
import { type UserRole } from '../roles.decorator.js';

@Entity('users')
=======
import type { UserRole } from '../roles.decorator.js';
import {  Entity, Column, JoinColumn, ManyToOne, Relation, UpdateDateColumn,} from 'typeorm';
@typeorm.Entity('users')
>>>>>>> 4f93cc2 (Updated application module)
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar2', length: 100 })
  name: string;

  @Column({ type: 'varchar2', length: 150, unique: true })
  email: string;

  @Column({ type: 'varchar2', length: 20, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar2', length: 255, nullable: true })
  resumeUrl: string | null;

  @Column({ type: 'varchar2', length: 100, nullable: true })
  location: string | null;

  @Column({ type: 'varchar2', length: 1000, nullable: true })
  skills: string | null;

  @Column({
    type: 'varchar2',
    length: 255,
    select: false,
  })
  password: string;

  // Job Seeker, Employer or Admin
  @Column({
    type: 'varchar2',
    length: 20,
    default: 'job_seeker',
  })
  role: UserRole;

  @Column({ type: 'number', default: 0 })
  isEmailVerified: number;

  @OneToMany(() => Job, (job) => job.postedBy)
  jobs: Relation<Job[]>;

  @Column({
    type: 'varchar2',
    length: 64,
    nullable: true,
    select: false,
  })
  emailVerificationTokenHash: string | null;

  @Column({
    type: 'timestamp',
    nullable: true,
    select: false,
  })
  emailVerificationTokenExpiresAt: Date | null;

<<<<<<< HEAD
  @Column({
    name: 'IS_ACTIVE',
    type: 'number',
    default: 1,
  })
  isActive: number;

  @CreateDateColumn({ type: 'timestamp' })
=======
@typeorm.ManyToOne(() => Company, 
{ onDelete: 'SET NULL', nullable: true })
@typeorm.JoinColumn({ 
  name: 'companyId',
  referencedColumnName: 'companyId'})

  @typeorm.CreateDateColumn({ type: 'timestamp' })
>>>>>>> 4f93cc2 (Updated application module)
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
