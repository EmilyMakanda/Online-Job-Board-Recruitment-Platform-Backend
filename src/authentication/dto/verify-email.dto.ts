import { ApiProperty } from '@nestjs/swagger';
import { Matches } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty({
    description: 'Six-digit verification code sent to the registered email',
    example: '042681',
    pattern: '^\\d{6}$',
  })
  @Matches(/^\d{6}$/)
  token!: string;
}
