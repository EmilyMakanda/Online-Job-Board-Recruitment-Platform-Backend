
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('companies')
@Index('UQ_COMPANY_EMPLOYER', ['employerId'], { unique: true })
export class Company {
  @PrimaryGeneratedColumn({ name: 'company_id' })
  companyId: number;
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

@CreateDateColumn({
  name: 'createdAt',
  type: 'timestamp',
})
createdAt: Date;
@UpdateDateColumn({
  name: 'updatedAt',
  type: 'timestamp',
})
updatedAt: Date;
}
