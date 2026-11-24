import {
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';

@Entity('ADMIN_AUDIT_LOGS')
@Index('IX_ADMIN_AUDIT_CREATED_AT', ['createdAt'])
export class AdminAuditLog {
  @PrimaryGeneratedColumn({ name: 'LOG_ID', type: 'number' })
  logId: number;

  @Column({ name: 'ACTOR_ID', type: 'number' })
  actorId: number;

  @Column({ name: 'ACTION', type: 'varchar2', length: 80 })
  action: string;

  @Column({ name: 'TARGET_TYPE', type: 'varchar2', length: 30 })
  targetType: string;

  @Column({ name: 'TARGET_ID', type: 'varchar2', length: 36 })
  targetId: string;

  @Column({
    name: 'DETAILS',
    type: 'varchar2',
    length: 2000,
    nullable: true,
  })
  details: string | null;

  @CreateDateColumn({ name: 'CREATED_AT', type: 'timestamp' })
  createdAt: Date;
}
