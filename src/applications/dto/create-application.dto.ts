import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min,} from 'class-validator';

export class CreateApplicationDto {

    @ApiProperty({ description:'The ID of the job being applied for', example:1})
    @IsInt()
    @Min(1)
    jobId: number;

    @ApiProperty({ description:'The cover letter for the application', example:'I am a highly motivated candidate...' })
    @IsOptional()
    @IsString()
    coverLetter?:string;
}