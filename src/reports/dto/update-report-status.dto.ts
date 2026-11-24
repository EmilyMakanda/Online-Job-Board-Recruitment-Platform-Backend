import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

import { ReportStatus } from '../entities/report.entity.js';

export class UpdateReportStatusDto {
  @ApiProperty({ enum: [ReportStatus.RESOLVED, ReportStatus.DISMISSED] })
  @IsIn([ReportStatus.RESOLVED, ReportStatus.DISMISSED])
  status: ReportStatus.RESOLVED | ReportStatus.DISMISSED;

  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  resolution?: string;
}
