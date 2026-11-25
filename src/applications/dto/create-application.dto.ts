import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateApplicationDto {
  @ApiProperty({
    description: 'The UUID of the job being applied for',
    example: '42f83d15-c798-4a46-9e83-d0fdb60a5e15',
  })
  @IsUUID()
  jobId: string;

  @ApiPropertyOptional({
    description: 'A short cover letter explaining the applicant\'s interest in the position',
    example: 'I am interestedin this position because...',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  coverLetter?: string;
}
