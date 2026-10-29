
import { ApiProperty } from '@nestjs/swagger';

export class CreateNotificationDto {
  @ApiProperty({
    description: 'ID of the user receiving the notification',
    example: 1,
  })
  userId: number;

  @ApiProperty({
    description: 'Notification message',
    example: 'Your job application has been received.',
  })
  message: string;

  @ApiProperty({
    description: 'Email address of the recipient',
    example: 'user@example.com',
    required: false,
  })
  email?: string;
}
