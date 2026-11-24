import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateApplicationDto {
  @ApiPropertyOptional({
    example: 'I would be glad to discuss my experience in more detail.',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  coverLetter?: string;
}
