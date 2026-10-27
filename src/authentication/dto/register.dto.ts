import { IsEmail, IsString, IsNotEmpty, IsAlphanumeric } from "class-validator";
import {ApiProperty }from '@nestjs/swagger';
export class RegisterDto {
@ApiProperty({description:'The name of the user'})
@IsString() 
name!: string;
@ApiProperty({description:'The email of the user'})
@IsEmail()
email!: string;
@ApiProperty({description:'The password of the user'})
@IsNotEmpty()
@IsAlphanumeric()
password!: string;;
}

