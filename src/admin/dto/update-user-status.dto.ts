import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class UpdateUserStatusDto {
  @ApiProperty({
    description: 'Set the account active state: 1 = active, 0 = deactivated.',
    example: 0,
    enum: [0, 1],
    type: Number,
  })
  @IsIn([0, 1])
  isActive: number;
}
