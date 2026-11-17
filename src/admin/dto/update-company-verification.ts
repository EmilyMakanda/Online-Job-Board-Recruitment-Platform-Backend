import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { VerificationStatus } from '../../company/entities/company.entity.js';

export class UpdateCompanyVerificationDto {
  @ApiProperty({
    example: VerificationStatus.VERIFIED,
    enum: [VerificationStatus.VERIFIED, VerificationStatus.REJECTED],
    description: 'Admin decision for the company',
  })
  @IsIn([VerificationStatus.VERIFIED, VerificationStatus.REJECTED])
  verificationStatus: VerificationStatus.VERIFIED | VerificationStatus.REJECTED;
}