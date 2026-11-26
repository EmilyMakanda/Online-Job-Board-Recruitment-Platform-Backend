
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  MaxLength,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateCompanyDto {
  @ApiProperty({
    example: 'MW-REG-2026-001',
    description: 'Unique company registration number',
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  @Matches(/^[A-Z0-9/-]+$/, {
    message: 'Registration number can only contain letters, numbers, hyphens and slashes',
  })
  registrationNumber: string;

  @ApiProperty({
    example: 'Tech Solutions Ltd',
    description: 'Name of the company',
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @Length(2, 150)
  companyName: string;

  @ApiPropertyOptional({
    example: 'A software development company.',
    description: 'Brief description of the company',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({
    example: 'https://example.com',
    description: 'Official company website',
  })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(255)
  website?: string;
}
