
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn, 
} from 'typeorm';
import { Company } from '../../company/entities/company.entity.js';

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
  role: string;

  @Column({
    type: 'number',
    nullable: true
  })
  companyId: number | null; 

  @Column({ type: 'number', default: 0 })
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
  @Column({
  name: 'IS_ACTIVE',
  type: 'number',
  default: 1,
})
@Column({ name: 'COMPANY_ID', type: 'number', nullable: true })
  companyId: number | null;

@ManyToOne(() => Company, { onDelete: 'SET NULL', nullable: true })
@JoinColumn({ name: 'COMPANY_ID' })
company: Company | null;
isActive: number;
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}
