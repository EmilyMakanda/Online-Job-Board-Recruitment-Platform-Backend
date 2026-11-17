import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AdminUserResponseDto {
  @ApiProperty({ example: 21 })
  id: number;

  @ApiProperty({ example: 'Jordan Makanda' })
  name: string;

  @ApiProperty({ example: 'jordan@example.com' })
  email: string;

  @ApiProperty({ enum: ['job_seeker', 'employer', 'admin'] })
  role: 'job_seeker' | 'employer' | 'admin';

  @ApiProperty({
    description: '1 means active; 0 means deactivated.',
    example: 1,
  })
  isActive: number;

  @ApiProperty({
    description: '1 means verified; 0 means unverified.',
    example: 1,
  })
  isEmailVerified: number;

  @ApiPropertyOptional({ example: '+265999123456', nullable: true })
  phone: string | null;

  @ApiPropertyOptional({ example: 'Lilongwe', nullable: true })
  location: string | null;

  @ApiPropertyOptional({ example: 'uploads/cvs/jordan-cv.pdf', nullable: true })
  resumeUrl: string | null;

  @ApiPropertyOptional({ example: 'NestJS, TypeORM', nullable: true })
  skills: string | null;

  @ApiPropertyOptional({ example: 4, nullable: true })
  companyId: number | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}

export class AdminUserStatusResponseDto {
  @ApiProperty({ example: 'User account activated successfully.' })
  message: string;

  @ApiProperty({ type: AdminUserResponseDto })
  user: AdminUserResponseDto;
}

export class AdminCompanyResponseDto {
  @ApiProperty({ example: 4 })
  companyId: number;

  @ApiProperty({ example: 'Acme Ltd' })
  companyName: string;

  @ApiPropertyOptional({ example: 'A software company.', nullable: true })
  description: string | null;

  @ApiPropertyOptional({ example: 'https://acme.example', nullable: true })
  website: string | null;

  @ApiProperty({ example: 22 })
  employerId: number;

  @ApiProperty({
    enum: ['pending', 'verified', 'rejected'],
    example: 'pending',
  })
  verificationStatus: string;

  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    nullable: true,
  })
  verifiedAt: Date | null;
}

export class AdminJobResponseDto {
  @ApiProperty({ example: '64ccf89b-b176-431a-b31c-68dbdaf8147d' })
  id: string;

  @ApiProperty({ example: 'Software Engineer' })
  title: string;

  @ApiProperty({ example: 'Build and maintain platform services.' })
  description: string;

  @ApiProperty({ example: 'Lilongwe' })
  location: string;

  @ApiProperty({
    enum: ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'CLOSED', 'REMOVED'],
    example: 'PENDING',
  })
  status: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;

  @ApiPropertyOptional({ type: AdminCompanyResponseDto, nullable: true })
  company?: AdminCompanyResponseDto | null;
}

export class AdminApplicationResponseDto {
  @ApiProperty({ example: 51 })
  applicationId: number;

  @ApiProperty({ example: 21 })
  jobSeekerId: number;

  @ApiProperty({
    enum: ['SUBMITTED', 'IN_REVIEW', 'ACCEPTED', 'REJECTED'],
    example: 'SUBMITTED',
  })
  status: string;

  @ApiPropertyOptional({ example: 'I am interested in this role.' })
  coverLetter: string;

  @ApiProperty({ type: String, format: 'date-time' })
  appliedAt: Date;

  @ApiProperty({ type: AdminJobResponseDto })
  job: AdminJobResponseDto;
}

export class AdminStatisticsResponseDto {
  @ApiProperty({ example: 120 })
  totalUsers: number;

  @ApiProperty({ example: 82 })
  totalJobSeekers: number;

  @ApiProperty({ example: 32 })
  totalEmployers: number;

  @ApiProperty({ example: 6 })
  totalAdministrators: number;

  @ApiProperty({ example: 45 })
  totalJobs: number;

  @ApiProperty({ example: 30 })
  approvedJobs: number;

  @ApiProperty({ example: 8 })
  pendingJobs: number;

  @ApiProperty({ example: 5 })
  rejectedJobs: number;

  @ApiProperty({ example: 210 })
  totalApplications: number;
}
