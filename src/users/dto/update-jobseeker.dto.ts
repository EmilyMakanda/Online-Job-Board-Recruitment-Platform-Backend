import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateJobSeekerDto } from './create-jobseeker.dto.js';

export class UpdateJobSeekerDto extends PartialType(
  OmitType(CreateJobSeekerDto, ['password'] as const),
) {}