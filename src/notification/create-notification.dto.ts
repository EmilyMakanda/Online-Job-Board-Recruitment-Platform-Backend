
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateNotificationDto {

  @ApiProperty({
    example: 1,
    description: 'ID of the notification recipient',
  })
  @IsNumber()
  userId: number;

  @ApiProperty({
    example: 'Your job application has been received.',
    description: 'Notification message',
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({
    example: 'chancynyirongo929@gmail.com',
    description: 'Recipient email address',
  })
  @IsEmail()
  email: string;
}
