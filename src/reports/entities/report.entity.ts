import {
  Column,
  Check,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type ReportTargetType = 'user' | 'job';

export enum ReportStatus {
  PENDING = 'pending',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed',
}

@Entity('reports')
@Index('IX_REPORTS_STATUS', ['status'])
@Check('CK_REPORTS_TARGET_TYPE', "TARGET_TYPE IN ('user', 'job')")
@Check('CK_REPORTS_STATUS', "STATUS IN ('pending', 'resolved', 'dismissed')")
export class Report {
  @PrimaryGeneratedColumn({ name: 'REPORT_ID', type: 'number' })
  reportId: number;

  @Column({ name: 'REPORTER_ID', type: 'number' })
  reporterId: number;

  @Column({ name: 'TARGET_TYPE', type: 'varchar2', length: 20 })
  targetType: ReportTargetType;

  @Column({ name: 'TARGET_ID', type: 'varchar2', length: 36 })
  targetId: string;

  @Column({ name: 'REASON', type: 'varchar2', length: 200 })
  reason: string;

  @Column({ name: 'DETAILS', type: 'varchar2', length: 2000 })
  details: string;

  @Column({
    name: 'STATUS',
    type: 'varchar2',
    length: 20,
    default: ReportStatus.PENDING,
  })
  status: ReportStatus;

  @Column({
    name: 'RESOLUTION',
    type: 'varchar2',
    length: 2000,
    nullable: true,
  })
  resolution: string | null;

  @CreateDateColumn({ name: 'CREATED_AT', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'UPDATED_AT', type: 'timestamp' })
  updatedAt: Date;

  @Column({ name: 'RESOLVED_AT', type: 'timestamp', nullable: true })
  resolvedAt: Date | null;
}
