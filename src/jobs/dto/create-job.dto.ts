import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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
    example:
      'We are looking for a skilled software engineer to join our team.',
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
}