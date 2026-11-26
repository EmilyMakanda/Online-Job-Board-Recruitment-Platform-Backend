import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsDate,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export const JOB_APPLICATION_FIELD_KEYS = [
  'cv',
  'coverLetter',
  'highestEducation',
  'fieldOfStudy',
  'yearsOfExperience',
  'currentEmploymentStatus',
  'expectedSalary',
  'noticePeriod',
  'availableStartDate',
  'willingToRelocate',
  'portfolioUrl',
  'linkedinUrl',
  'additionalAnswers',
] as const;

export class JobApplicationFieldDto {
  @ApiProperty({ enum: JOB_APPLICATION_FIELD_KEYS, example: 'cv' })
  @IsString()
  @IsIn(JOB_APPLICATION_FIELD_KEYS)
  fieldKey: (typeof JOB_APPLICATION_FIELD_KEYS)[number];

  @ApiProperty({ example: 'CV / Resume', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  fieldLabel: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  isRequired: boolean;

  @ApiProperty({ example: true })
  @IsBoolean()
  isEnabled: boolean;
}

export class CreateJobDto {
  @ApiProperty({
    description: 'The title of the job listing',
    example: 'Software Engineer',
    maxLength: 150,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  title: string;

  @ApiProperty({
    description: 'The description of the job listing',
    example: 'We are looking for a skilled software engineer to join our team.',
    maxLength: 2000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  description: string;

  @ApiProperty({
    description: 'The location of the job listing',
    example: 'Blantyre, BT',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  location: string;

  @ApiProperty({
    description:
      'The date and time after which the job is no longer available.',
    example: '2026-12-31T23:59:59.000Z',
    type: String,
    format: 'date-time',
  })
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  deadline: Date;

  @ApiProperty({
    description:
      'Application fields to display and require for this job. If omitted, CV is required for compatibility.',
    type: [JobApplicationFieldDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique((field: JobApplicationFieldDto) => field.fieldKey)
  @ValidateNested({ each: true })
  @Type(() => JobApplicationFieldDto)
  applicationRequirements?: JobApplicationFieldDto[];
}
