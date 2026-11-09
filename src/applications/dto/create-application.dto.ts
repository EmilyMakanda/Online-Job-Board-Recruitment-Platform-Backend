import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateApplicationDto {
  @ApiProperty({
    description: 'The ID of the job being applied for',
    example: '42f83d15-c798-4a46-9e83-d0fdb60a5e15',
  })
  @IsUUID()
  jobId: string;

  @ApiProperty({
    description: 'The cover letter for the application',
    example: 'I am a highly motivated candidate...',
  })
  @IsOptional()
  @IsString()
  coverLetter?: string;
}
