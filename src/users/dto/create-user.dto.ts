import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Matches,
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

  @ApiPropertyOptional({ example: '+265999123456' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Matches(/^\+?[0-9]{9,15}$/, {
    message: 'phone must be a valid phone number',
  })
  phone?: string;

  @ApiProperty({ example: 'yambeni123' })
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  password: string;
}
