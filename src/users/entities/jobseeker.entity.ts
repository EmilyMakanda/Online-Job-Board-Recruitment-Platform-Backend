import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('jobseekers')
export class Jobseeker {
  @PrimaryGeneratedColumn({ name: 'jobseeker_id' })
  id: number;

  @Column({ name: 'full_name', length: 100 })
  fullName: string;

  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  dateOfBirth: Date;

  @Column({ length: 150, unique: true })
  email: string;

  @Column({ name: 'password_hash', length: 255, select: false })
  passwordHash: string;

  @Column({ name: 'phone', nullable: true, length: 20 })
  phone: string;

  @Column({ length: 100, nullable: true })
  location: string;

  @Column({ name: 'resume_url', length: 255, nullable: true })
  resumeUrl: string;

  @Column({ length: 1000, nullable: true })
  skills: string;
}
