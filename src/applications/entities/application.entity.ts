import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  type Relation,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Job } from '../../jobs/entities/jobs.entity.js';
import { ApplicationDocument } from './application-document.entity.js';

export enum ApplicationStatus {
  SUBMITTED = 'SUBMITTED',
  IN_REVIEW = 'IN_REVIEW',
  SHORTLISTED = 'SHORTLISTED',
  INTERVIEW = 'INTERVIEW',
  OFFERED = 'OFFERED',
  ACCEPTED = 'ACCEPTED',
  HIRED = 'HIRED',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN',
}

@Entity('Applications')
@Index('UQ_APPS_JOBSEEKER_JOB', ['jobSeekerId', 'job'], { unique: true })
export class Application {
  @PrimaryGeneratedColumn({
    name: 'APPLICATION_ID',
    type: 'number',
  })
  applicationId: number;

  @Column({
    name: 'JOBSEEKER_ID',
    type: 'number',
  })
  jobSeekerId: number;

  @Column({
    name: 'STATUS',
    type: 'varchar2',
    length: 30,
    default: ApplicationStatus.SUBMITTED,
  })
  status: ApplicationStatus;

  @Column({
    name: 'COVER_LETTER',
    type: 'varchar2',
    length: 2000,
    nullable: true,
  })
  coverLetter: string | null;

  @Column({
    name: 'APPLICATION_ANSWERS',
    type: 'clob',
    nullable: true,
  })
  answers: string | null;

  @CreateDateColumn({
    name: 'APPLIED_AT',
    type: 'timestamp',
  })
  appliedAt: Date;

  @UpdateDateColumn({
    name: 'UPDATED_AT',
    type: 'timestamp',
  })
  updatedAt: Date;

  @ManyToOne(() => Job, (job) => job.applications, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'JOB_ID', referencedColumnName: 'id' })
  job: Relation<Job>;

  @OneToMany(() => ApplicationDocument, (document) => document.application, {
    cascade: false,
  })
  documents: Relation<ApplicationDocument[]>;
}
