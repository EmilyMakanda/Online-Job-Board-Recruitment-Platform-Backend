import { CreateApplicationDto } from './create-application.dto.js';
import { IsOptional, IsString, } from 'class-validator';

export class UpdateApplicationDto  {
    @IsOptional()
    @IsString()
    coverLetter?:string;

}
