
import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class UpdateUserStatusDto {
  @ApiProperty({
    description: '1 = Active, 0 = Suspended',
    example: 0,
  })
  @IsIn([0, 1])
  isActive: number;
}
