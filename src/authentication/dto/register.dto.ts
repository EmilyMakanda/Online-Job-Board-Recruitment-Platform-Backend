import {
  IsEmail,
  IsString,
  IsNotEmpty,
  IsIn,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    description: 'The full name of the user',
    example: 'John Banda',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    description: 'The email address of the user',
    example: 'john@example.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'The password of the user (minimum 8 characters)',
    example: 'StrongPass123!',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password!: string;

  @ApiProperty({
    description: 'The role of the user',
    enum: ['job_seeker', 'employer'],
    example: 'job_seeker',
  })
  @IsString()
  @IsIn(['job_seeker', 'employer'])
  role!: 'job_seeker' | 'employer';
}
