import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class UpdateCompanyVerificationDto {
  @ApiProperty({
    example: 'verified',
    enum: ['verified', 'rejected'],
    description: 'Admin decision for the company',
    type: String,
  })
  @IsIn(['verified', 'rejected'])
  verificationStatus: 'verified' | 'rejected';
}
