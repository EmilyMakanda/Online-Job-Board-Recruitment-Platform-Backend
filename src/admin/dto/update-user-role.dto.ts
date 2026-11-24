import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class UpdateUserRoleDto {
  @ApiProperty({
    enum: ['job_seeker', 'employer', 'admin'],
    example: 'employer',
  })
  @IsIn(['job_seeker', 'employer', 'admin'])
  role: 'job_seeker' | 'employer' | 'admin';
}
