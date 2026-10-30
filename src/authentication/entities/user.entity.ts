
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  CreateDateColumn,
  OneToMany,
  type Relation
} from 'typeorm';
import { Job } from '../../jobs/entities/jobs.entity.js';

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

  @Column({ type: 'varchar2', length: 255, select: false })
  password: string;

  // Differentiates job seekers from employers
  @Column({
  type: 'varchar2',
  length: 20,
  default: 'job_seeker',
})
role: 'job_seeker' | 'employer';

  @Column({
    type: 'number',
    nullable: true
  })
  companyId: number | null; 

  @Column({
    type: 'number',
    default: 0,
  })
  isEmailVerified: number;

  @OneToMany(()=>Job, (job) => job.postedBy)
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

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

}

