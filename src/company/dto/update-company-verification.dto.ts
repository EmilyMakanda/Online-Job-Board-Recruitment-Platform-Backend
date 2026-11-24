import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class UpdateCompanyVerificationDto {
  @ApiProperty({
    enum: ['verified', 'rejected'],
    example: 'verified',
  })
  @IsIn(['verified', 'rejected'])
  verificationStatus: 'verified' | 'rejected';
}
