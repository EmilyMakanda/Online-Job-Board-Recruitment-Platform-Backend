
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUrl,
  Length,
  MaxLength,
} from 'class-validator';

export class UpdateCompanyDto {
  @ApiPropertyOptional({
    example: 'Tech Solutions Ltd',
    description: 'Updated company name',
  })
  @IsOptional()
  @IsString()
  @Length(2, 150)
  companyName?: string;

  @ApiPropertyOptional({
    example: 'A software development company.',
    description: 'Updated company description',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({
    example: 'https://example.com',
    description: 'Updated official company website',
  })
  @IsOptional()
  @IsUrl()
  @MaxLength(255)
  website?: string;

  @ApiPropertyOptional({
    example: 'Lilongwe',
    description: 'Updated company location',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;
}
