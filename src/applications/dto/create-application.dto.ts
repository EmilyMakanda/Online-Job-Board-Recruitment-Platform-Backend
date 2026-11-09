import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateApplicationDto {
  @ApiProperty({
    description: 'The ID of the job being applied for',
    example: '42f83d15-c798-4a46-9e83-d0fdb60a5e15',
  })
  @IsUUID()
  jobId: string;

  @ApiPropertyOptional({
    description: 'The cover letter for the application',
    example: 'I am a highly motivated candidate...',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  coverLetter?: string;
}
