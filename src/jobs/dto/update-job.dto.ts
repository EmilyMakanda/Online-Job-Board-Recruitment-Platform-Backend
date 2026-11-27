import { OmitType, PartialType } from '@nestjs/swagger';

import { CreateJobDto } from './create-job.dto.js';

export class UpdateJobDto extends PartialType(
  OmitType(CreateJobDto, ['applicationRequirements'] as const),
) {}
