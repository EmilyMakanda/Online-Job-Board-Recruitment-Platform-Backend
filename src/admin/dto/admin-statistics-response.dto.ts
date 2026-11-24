import { ApiProperty } from '@nestjs/swagger';

export class AdminStatisticsResponseDto {
  @ApiProperty({ example: 120 })
  totalUsers: number;

  @ApiProperty({ example: 82 })
  totalJobSeekers: number;

  @ApiProperty({ example: 32 })
  totalEmployers: number;

  @ApiProperty({ example: 6 })
  totalAdministrators: number;

  @ApiProperty({ example: 45 })
  totalJobs: number;

  @ApiProperty({ example: 30 })
  approvedJobs: number;

  @ApiProperty({ example: 8 })
  pendingJobs: number;

  @ApiProperty({ example: 5 })
  rejectedJobs: number;

  @ApiProperty({ example: 210 })
  totalApplications: number;
}
