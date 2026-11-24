import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AdminAuditLogResponseDto {
  @ApiProperty({ example: 17 })
  logId: number;

  @ApiProperty({ example: 1 })
  actorId: number;

  @ApiProperty({ example: 'job.approve' })
  action: string;

  @ApiProperty({ example: 'job' })
  targetType: string;

  @ApiProperty({ example: '64ccf89b-b176-431a-b31c-68dbdaf8147d' })
  targetId: string;

  @ApiPropertyOptional({
    example: '{"from":"PENDING","to":"APPROVED"}',
    nullable: true,
  })
  details: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;
}
