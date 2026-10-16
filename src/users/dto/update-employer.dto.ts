import {OmitType,  PartialType } from '@nestjs/swagger';
import { CreateEmployerDto } from './create-employer.dto.js';

export class UpdateEmployerDto extends PartialType(OmitType(CreateEmployerDto, ['password'] as const)) {}
