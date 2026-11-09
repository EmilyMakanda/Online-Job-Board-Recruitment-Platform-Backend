import {ApiProperty} from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { ApplicationStatus } from '../entities/application.entity.js';

const REVIEW_STATUSES = [
  ApplicationStatus.IN_REVIEW,
  ApplicationStatus.ACCEPTED,
  ApplicationStatus.REJECTED,
] as const;

export class UpdateApplicationDto {
  @ApiProperty({
    enum: REVIEW_STATUSES,
    example: ApplicationStatus.IN_REVIEW,
    description: 'New application status',
  })
  @IsIn(REVIEW_STATUSES)
  status:(typeof REVIEW_STATUSES)[number];
  coverLetter: undefined;
}
