import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';

@Entity('JOB_APPLICATION_REQUIREMENTS')
export class JobApplicationRequirement {
  @PrimaryGeneratedColumn()
  requirementId: number;

  @Column({ name: 'JOB_ID', type: 'varchar2', length: 36 })
  jobId: string;

  @Column({ name: 'FIELD_KEY', type: 'varchar2', length: 50 })
  fieldKey: string;

  @Column({ name: 'FIELD_LABEL', type: 'varchar2', length: 100 })
  fieldLabel: string;

  @Column({ name: 'IS_REQUIRED', type: 'number', default: 0 })
  isRequired: number;

  @Column({ name: 'IS_ENABLED', type: 'number', default: 1 })
  isEnabled: number;
}