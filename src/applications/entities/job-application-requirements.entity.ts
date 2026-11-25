import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  type Relation,
} from 'typeorm';
import { Job } from '../../jobs/entities/jobs.entity.js';

@Entity('JOB_APPLICATION_REQUIREMENTS')
export class JobApplicationRequirement {
  @PrimaryGeneratedColumn({ name: 'REQUIREMENT_ID', type: 'number' })
  requirementId: number;

  @Column({ name: 'FIELD_KEY', type: 'varchar2', length: 50 })
  fieldKey: string;

  @Column({ name: 'FIELD_LABEL', type: 'varchar2', length: 100 })
  fieldLabel: string;

  @Column({ name: 'IS_REQUIRED', type: 'number', default: 0 })
  isRequired: number;

  @Column({ name: 'IS_ENABLED', type: 'number', default: 1 })
  isEnabled: number;

  @ManyToOne(() => Job, (job) => job.applicationRequirements, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'JOB_ID', referencedColumnName: 'id' })
  job: Relation<Job>;
}
