import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn } from 'class-validator';

export class UpdateUserStatusDto {
  @ApiProperty({
    description: '1 activates the account; 0 deactivates it.',
    enum: [0, 1],
    example: 0,
  })
  @Type(() => Number)
  @IsIn([0, 1])
  isActive: 0 | 1;
}
