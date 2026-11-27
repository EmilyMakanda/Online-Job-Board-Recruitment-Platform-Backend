import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsIn,
  ArrayUnique,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  APPLICATION_FIELD_KEYS,
  type ApplicationFieldKey,
} from '../application-fields.js';

export class JobRequirementItemDto {
  @ApiProperty({
    example: 'highestEducation',
    description: 'Application field key',
    enum: APPLICATION_FIELD_KEYS,
  })
  @IsIn(APPLICATION_FIELD_KEYS)
  fieldKey: ApplicationFieldKey;

  @ApiProperty({ example: true })
  @IsBoolean()
  isRequired: boolean;

  @ApiProperty({ example: true })
  @IsBoolean()
  isEnabled: boolean;
}

export class SetJobApplicationRequirementsDto {
  @ApiProperty({ type: [JobRequirementItemDto] })
  @IsArray()
  @ArrayUnique((field: JobRequirementItemDto) => field.fieldKey)
  @ValidateNested({ each: true })
  @Type(() => JobRequirementItemDto)
  requirements: JobRequirementItemDto[];
}