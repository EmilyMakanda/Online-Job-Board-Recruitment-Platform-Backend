import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { ApplicationStatus } from '../entities/application.entity.js';

const EMPLOYER_STATUSES = [
  ApplicationStatus.IN_REVIEW,
  ApplicationStatus.SHORTLISTED,
  ApplicationStatus.INTERVIEW,
  ApplicationStatus.OFFERED,
  ApplicationStatus.ACCEPTED,
  ApplicationStatus.HIRED,
  ApplicationStatus.REJECTED,
] as const;

export class UpdateApplicationStatusDto {
  @ApiProperty({
    enum: EMPLOYER_STATUSES,
    example: ApplicationStatus.IN_REVIEW,
    description: 'Next recruitment stage for this application.',
  })
  @IsIn(EMPLOYER_STATUSES)
  status: (typeof EMPLOYER_STATUSES)[number];
}
