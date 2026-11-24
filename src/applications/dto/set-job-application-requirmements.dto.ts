import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class JobRequirementItemDto {
  @ApiProperty({
    example: 'highestEducation',
    description: 'Application field key',
  })
  @IsString()
  fieldKey: string;

  @ApiProperty({ example: 'Highest Education' })
  @IsString()
  @MaxLength(100)
  fieldLabel: string;

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
  @ValidateNested({ each: true })
  @Type(() => JobRequirementItemDto)
  requirements: JobRequirementItemDto[];
}