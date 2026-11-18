import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import type { ReportTargetType } from '../entities/report.entity.js';

export class CreateReportDto {
  @ApiProperty({
    description: 'Target category for the report.',
    enum: ['user', 'job'],
    example: 'job',
  })
  @IsIn(['user', 'job'])
  targetType: ReportTargetType;

  @ApiProperty({
    description: 'Numeric user ID or job UUID, depending on targetType.',
    example: '64ccf89b-b176-431a-b31c-68dbdaf8147d',
    maxLength: 36,
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(36)
  targetId: string;

  @ApiProperty({
    description: 'Short reason for reporting the target.',
    example: 'Misleading job description',
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  reason: string;

  @ApiProperty({
    description: 'Details to help administrators review the report.',
    example: 'The listing contains inaccurate salary details.',
    maxLength: 2000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  details: string;
}
