import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'Email address used when registering the account',
    example: 'jordan@example.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'Account password (at least 8 characters)',
    example: 'StrongPass123!',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty()
  password!: string;
}
