import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { ReportStatus } from '../../reports/entities/report.entity.js';

export class UpdateReportStatusDto {
  @ApiProperty({
    description: 'Administrator decision for this report.',
    enum: [ReportStatus.RESOLVED, ReportStatus.DISMISSED],
    example: ReportStatus.RESOLVED,
  })
  @IsIn([ReportStatus.RESOLVED, ReportStatus.DISMISSED])
  status: ReportStatus.RESOLVED | ReportStatus.DISMISSED;

  @ApiPropertyOptional({
    description: 'Optional summary of the moderation action taken.',
    example: 'The reported job was removed from public listings.',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  resolution?: string;
}
