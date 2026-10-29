import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'New display name for your account.',
    example: 'Jordan Makanda',
    minLength: 1,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @ApiPropertyOptional({
    description:
      'New email address. Changing it resets email verification for the account.',
    example: 'jordan.makanda@example.com',
    maxLength: 150,
  })
  @IsOptional()
  @IsEmail()
  email?: string;
}
