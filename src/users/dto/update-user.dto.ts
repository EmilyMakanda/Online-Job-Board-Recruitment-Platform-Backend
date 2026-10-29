import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'christian yambeni' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: '+265999123456' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Matches(/^\+?[0-9]{9,15}$/, {
    message: 'phone must be a valid phone number',
  })
  phone?: string;

  @ApiPropertyOptional({ example: 'Lilongwe' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  location?: string;

  @ApiPropertyOptional({ example: 'uploads/cvs/christian-cv.pdf' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  resumeUrl?: string;

  @ApiPropertyOptional({ example: 'NestJS, TypeORM, SQL, C++' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  skills?: string;
}