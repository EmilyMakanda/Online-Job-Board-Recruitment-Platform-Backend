import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
  type Relation,
} from 'typeorm';
import { User } from '../../authentication/entities/user.entity.js';
import { Application } from '../../applications/entities/application.entity.js';
import { Company } from '../../company/entities/company.entity.js';

export enum JobStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  DRAFT = 'DRAFT',
}

@Entity('jobs')
export class Job {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar2', length: 150, nullable: false })
  title: string;

  @Column({ type: 'varchar2', length: 2000, nullable: false })
  description: string;

  @Column({ type: 'varchar2', length: 100, nullable: false })
  location: string;

  @Index()
  @Column({ type: 'varchar2', length: 20, default: JobStatus.OPEN })
  status: JobStatus;

  @ManyToOne(() => Company, (company) => company.jobs, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'company_id' })
  company: Relation<Company>;

  // The user who posted the job
  @ManyToOne(() => User, (user) => user.jobs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'posted_by_user_id' })
  postedBy: Relation<User>;

  @OneToMany(() => Application, (application) => application.job)
  applications: Relation<Application[]>;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}