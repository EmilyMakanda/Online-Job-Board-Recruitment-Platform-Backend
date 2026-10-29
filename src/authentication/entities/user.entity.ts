
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar2', length: 100 })
  name: string;

  @Column({ type: 'varchar2', length: 150, unique: true })
  email: string;

  @Column({ type: 'varchar2', length: 255, select: false })
  password: string;

  // Differentiates job seekers from employers
  @Column({
  type: 'varchar2',
  length: 20,
  default: 'job_seeker',
})
role: 'job_seeker' | 'employer';

  @Column({ type: 'number', default: 0 })
  isEmailVerified: number;

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

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}
