
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export enum AssignableUserRole {
  JOB_SEEKER = 'job_seeker',
  EMPLOYER = 'employer',
  ADMIN = 'admin',
}

export class UpdateUserRoleDto {
  @ApiProperty({
    enum: AssignableUserRole,
    example: AssignableUserRole.EMPLOYER,
    description: 'New role assigned by an administrator.',
  })
  @IsEnum(AssignableUserRole)
  role: AssignableUserRole;
}
