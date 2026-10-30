import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, Length, MaxLength } from 'class-validator';

export class CreateCompanyDto {
  @ApiProperty({
    example: 'Tech Solutions Ltd',
    description: 'Name of the company',
  })
  @IsString()
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
  @IsUrl()
  @MaxLength(255)
  website?: string;

  @ApiPropertyOptional({
    example: 'Lilongwe',
    description: 'Company location',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  location?: string;
}