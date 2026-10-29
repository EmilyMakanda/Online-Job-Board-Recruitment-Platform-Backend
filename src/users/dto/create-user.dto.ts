import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'christian yambeni' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'christian@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'yambeni123' })
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  password: string;
}
