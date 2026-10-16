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
  MinLength
} from 'class-validator';

export class CreateJobSeekerDto {
  @ApiProperty({ example: 'Christian Yambeni' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  fullName: string;

  @ApiProperty({ example: 'christian@example.com' })
  @IsEmail()
  @MaxLength(150)
  email: string;

  @ApiProperty({ example: 'StrongPass123!' })
@IsString()
@MinLength(8)
@MaxLength(64)
password: string;

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
  @MaxLength(100)
  location?: string;

  @ApiPropertyOptional({ example: 'https://example.com/cv.pdf' })
  @IsOptional()
  @IsUrl()
  @MaxLength(255)
  resumeUrl?: string;

  @ApiPropertyOptional({ example: 'TypeScript, SQL, Networking' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  skills?: string;

  @ApiPropertyOptional({ example: '2002-05-14' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;
}
