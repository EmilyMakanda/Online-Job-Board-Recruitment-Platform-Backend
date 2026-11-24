import { ApiProperty, ApiPropertyOptional, DeepPartial } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength, IsNumber, Min, IsBoolean, IsDateString, IsUrl, } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateApplicationDto {
  @ApiProperty({
    description: 'The UUID of the job being applied for',
    example: '42f83d15-c798-4a46-9e83-d0fdb60a5e15',
  })
  @IsUUID()
  jobId: string;

  @ApiPropertyOptional({
    description: 'Applicant highest level of education',
    example: "Bachelor's degree",
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  highestEducation?: string;

  @ApiPropertyOptional({
    description: 'Applicant field of study',
    example: 'Computer Science'
  })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  fieldOfStudy?: string;

  @ApiPropertyOptional({
    description: 'Years of working experience',
    example: 2,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  yearsOfExperience?: number;

  @ApiPropertyOptional({
    description: 'Applicant current employment status',
    example: 'Employed',
  })

  @ApiPropertyOptional({
    description: 'Expected salary',
    example: 850000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  expectedSalary?: number;

  @ApiPropertyOptional({
    description: 'Applicant notice period',
    example: 'One month',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  noticePeriod?: string;

  @ApiPropertyOptional({
    description: 'Date the applicant can start working',
    example: '2027-01-05',
  })
  @IsOptional()
  @IsDateString()
  availableStartDate?: string;

  @ApiPropertyOptional({
    description: 'Whether the applicant is willing to relocate',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  willingToRelocate?: boolean;

  @ApiPropertyOptional({
    description: 'Applicant portfolio URL',
    example: 'https://myportfolio.com',
  })
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  portfolioUrl?: string;

  @ApiPropertyOptional({
    description: 'Applicant LinkedIn profile URL',
    example: 'https://linkedin.com/in/example',
  })
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  linkedinUrl?: string;

  @ApiPropertyOptional({
    description:'Answers to additional employer-defined application questions',
    example: '{"whyJoinUs": "I am interested in this postion"}',
  })
  @IsOptional()
  @IsString()
  additionalAnswers?: string;

  @ApiPropertyOptional({
    description: 'Optional cover letter text (file uploads are handled separately)',
    example: 'I am interested in this position because...',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  coverLetter?: string;
  currentEmploymentStatus: DeepPartial<string | null> | undefined;
}
