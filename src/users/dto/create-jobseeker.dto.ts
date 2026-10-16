import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Matches,
} from 'class-validator';

export class CreateJobSeekerDto {
  @ApiProperty({ example: 'Christian Yambeni' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  fullName: string;

  @ApiProperty({ example: 'christian@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: '+265999123456' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Matches(/^\+?[0-9]{9,15}$/, {
    message: 'phone must be a valid phone number',
  })
  phone?: string;

  @ApiPropertyOptional({ example: 'Zomba' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ example: 'https://example.com/cv.pdf' })
  @IsOptional()
  @IsUrl()
  resumeUrl?: string;

  @ApiPropertyOptional({ example: 'TypeScript, SQL, Networking' })
  @IsOptional()
  @IsString()
  skills?: string;

  @ApiPropertyOptional({ example: '2002-05-14' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;
}
