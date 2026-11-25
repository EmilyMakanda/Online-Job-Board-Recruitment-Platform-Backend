import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
  OneToOne,
  JoinColumn,
  type Relation,
} from 'typeorm';
import { User } from '../../authentication/entities/user.entity.js';

export enum VerificationStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
}

@Entity('companies')
@Unique('UQ_COMPANY_REGISTRATION', ['registrationNumber'])
export class Company {
  @PrimaryGeneratedColumn('uuid', { name: 'company_id' })
  companyId: string;

  @Column({
    name: 'registration_number',
    type: 'varchar2',
    length: 50,
  })
  registrationNumber: string;

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
  location: string | null;

  @Column({
    type: 'varchar2',
    length: 255,
    nullable: true,
  })
  website: string | null;

  @Column({
    name: 'verification_status',
    type: 'varchar2',
    length: 20,
    default: VerificationStatus.PENDING,
  })
  verificationStatus: VerificationStatus;

  @Column({
    name: 'verified_at',
    type: 'timestamp',
    nullable: true,
  })
  verifiedAt: Date | null;

  @Column({
    name: 'employer_id',
    type: 'number',
    nullable: true,
  })
  employerId: number | null;

  @OneToOne(() => User, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'employer_id' })
  user: Relation<User> | null;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp',
  })
  updatedAt: Date;
}
