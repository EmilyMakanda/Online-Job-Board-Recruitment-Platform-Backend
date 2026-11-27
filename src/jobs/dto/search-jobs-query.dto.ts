import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';

export class SearchJobsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Search term matched against job title, description, or location.',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @ApiPropertyOptional({
    description: 'Optional location filter.',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  location?: string;
}
