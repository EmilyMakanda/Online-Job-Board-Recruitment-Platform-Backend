import { IsInt, IsOptional, IsString, Min,} from 'class-validator';

export class CreateApplicationDto {

    @IsInt()
    @Min(1)
    jobId: number;

    @IsOptional()
    @IsString()
    coverLetter?:string;
}