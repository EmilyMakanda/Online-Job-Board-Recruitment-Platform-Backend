import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('NOTIFICATIONS')
export class Notification {
  @PrimaryGeneratedColumn()
  ID: number;

  @Column({ name: 'USER_ID', type: 'number' })
  userId: number;

  @Column({ name: 'MESSAGE', type: 'varchar2', length: 1000 })
  message: string;

  @Column({ name: 'IS_READ', type: 'number', default: 0 })
  isRead: number;
  @Column({
  name: 'EMAIL',
  type: 'varchar2',
  length: 320,
  nullable: true,
})
email: string | null;

  @CreateDateColumn({ name: 'CREATED_AT', type: 'timestamp' })
  createdAt: Date;
}
