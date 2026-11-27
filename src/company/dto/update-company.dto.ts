
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUrl,
  Length,
  MaxLength,
  IsNotEmpty,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateCompanyDto {
  @ApiPropertyOptional({
    example: 'Tech Solutions Ltd',
    description: 'Updated company name',
  })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @Length(2, 150)
  companyName?: string;

  @ApiPropertyOptional({
    example: 'A software development company.',
    description: 'Updated company description',
  })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({
    example: 'https://example.com',
    description: 'Updated official company website',
  })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(255)
  website?: string;
}
