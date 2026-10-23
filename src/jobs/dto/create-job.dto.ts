import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateJobDto {

    @ApiProperty({ description: 'The title of the job listing', example: 'Software Engineer' })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiProperty({ description: 'The description of the job listing', example: 'We are looking for a skilled software engineer to join our team.' })
    @IsString()
    @IsNotEmpty()
    description: string;

    @ApiProperty({ description: 'The location of the job listing', example: 'Blantyre, BT' })
    @IsString()
    @IsNotEmpty()
    location: string;
}