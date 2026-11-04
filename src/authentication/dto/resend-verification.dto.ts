import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class ResendVerificationDto {
  @ApiProperty({
    description: 'Email address used to register the account',
    example: 'jordan@example.com',
  })
  @IsEmail()
  email!: string;
}
