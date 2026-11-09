
import * as typeorm from 'typeorm';
import { Company } from '../../company/entities/company.entity.js';
import { Job } from '../../jobs/entities/jobs.entity.js';
@typeorm.Entity('users')
export class User {
  @typeorm.PrimaryGeneratedColumn()
  id: number;

  @typeorm.Column({ type: 'varchar2', length: 100 })
  name: string;

  @typeorm.Column({ type: 'varchar2', length: 150, unique: true })
  email: string;

  @typeorm.Column({ type: 'varchar2', length: 20, nullable: true })
  phone: string | null;

  @typeorm.Column({type: 'varchar2',length: 255, nullable: true })
  resumeUrl: string | null;

  @typeorm.Column({type: 'varchar2', length: 100, nullable: true })
  location: string | null;

  @typeorm.Column({type: 'varchar2', length: 1000, nullable: true })
  skills: string | null;

  @typeorm.Column({
    type: 'varchar2',
    length: 255,
    select: false,
  })
  password: string;

  // Differentiates job seekers from employers
  @typeorm.Column({
    type: 'varchar2',
    length: 20,
    default: 'job_seeker',
  })
  role: UserRole;

  @typeorm.Column({
    type: 'number',
    nullable: true,
  })
  companyId: number | null;

  @ManyToOne(() => Company, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'COMPANY_ID' })
  company: Relation<Company> | null;

  @typeorm.Column({ type: 'number', default: 0 })
  isEmailVerified: number;

  @typeorm.OneToMany(()=>Job, (Job) => Job.postedBy)
  jobs:typeorm.Relation<Job[]>;

  @typeorm.Column({
    type: 'varchar2',
    length: 64,
    nullable: true,
  })
  emailVerificationTokenHash: string | null;

  @typeorm.Column({
    type: 'timestamp',
    nullable: true,
  })
  emailVerificationTokenExpiresAt: Date | null;
  @typeorm.Column({
  name: 'IS_ACTIVE',
  type: 'number',
  default: 1,
})


@typeorm.ManyToOne(() => Company, { onDelete: 'SET NULL', nullable: true })
@typeorm.JoinColumn({ name: 'COMPANY_ID' })
company: Company | null;
isActive: number;
  @typeorm.CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}