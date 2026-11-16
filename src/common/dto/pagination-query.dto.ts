import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class PaginationQueryDto {
  @ApiPropertyOptional({
    default: 1,
    minimum: 1,
    maximum: 1_000_000,
    description: '1-based page number.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1_000_000)
  page = 1;

  @ApiPropertyOptional({
    default: 50,
    minimum: 1,
    maximum: 100,
    description: 'Maximum number of records to return.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 50;
}
