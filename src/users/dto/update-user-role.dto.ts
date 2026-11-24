import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

import type { UserRole } from '../../authentication/roles.decorator.js';

export class UpdateUserRoleDto {
  @ApiProperty({
    enum: ['job_seeker', 'employer', 'admin'],
    example: 'employer',
  })
  @IsIn(['job_seeker', 'employer', 'admin'])
  role: UserRole;
}
