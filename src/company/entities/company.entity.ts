import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
  type Relation,
} from 'typeorm';
import { Job } from '../../jobs/entities/jobs.entity.js';

@Entity('companies')
@Index('UQ_COMPANY_EMPLOYER', ['employerId'], { unique: true })
export class Company {
  @PrimaryGeneratedColumn({ name: 'company_id' })
  companyId: number;

  @Column({
    name: 'company_name',
    type: 'varchar2',
    length: 150,
  })
  companyName: string;

  @Column({
    type: 'varchar2',
    length: 2000,
    nullable: true,
  })
  description: string | null;

  @Column({
    type: 'varchar2',
    length: 255,
    nullable: true,
  })
  website: string | null;

  @Column({
    name: 'employer_id',
    type: 'number',
  })
  employerId: number;

  @Column({
    name: 'VERIFICATION_STATUS',
    type: 'varchar2',
    length: 20,
    default: 'pending',
  })
  verificationStatus: string;

  @Column({
    name: 'VERIFIED_AT',
    type: 'timestamp',
    nullable: true,
  })
  verifiedAt: Date | null;

  // Inverse side of Job.company (Company 1 — M Job)
  @OneToMany(() => Job, (job) => job.company)
  jobs: Relation<Job[]>;

  @CreateDateColumn({ name: 'createdAt', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt', type: 'timestamp' })
  updatedAt: Date;
}