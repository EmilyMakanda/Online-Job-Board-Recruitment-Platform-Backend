import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'Alex Smith', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'alex@example.com', maxLength: 150 })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(150)
  email: string;

  @ApiProperty({
    example: 'StrongPass123!',
    minLength: 8,
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(255)
  password: string;
}
