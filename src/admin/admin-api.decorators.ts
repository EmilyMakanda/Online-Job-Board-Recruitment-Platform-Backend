import { applyDecorators, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard.js';
import { RolesGuard } from '../authentication/guards/roles.guards.js';
import { Roles } from '../authentication/roles.decorator.js';

export const UseAdminAccess = () =>
  applyDecorators(
    ApiBearerAuth('JWT-auth'),
    UseGuards(JwtAuthGuard, RolesGuard),
    UsePipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    ),
    Roles('admin'),
  );

export const ApiAdminOperation = (summary: string) =>
  applyDecorators(
    ApiOperation({
      summary,
      description: 'Requires a valid bearer JWT with the admin role.',
    }),
    ApiResponse({
      status: 400,
      description: 'Request parameters or body failed validation.',
    }),
    ApiResponse({ status: 401, description: 'A valid JWT is required.' }),
    ApiResponse({ status: 403, description: 'Administrator role required.' }),
  );

export const ApiAdminPagination = () =>
  applyDecorators(
    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      minimum: 1,
      maximum: 1_000_000,
      example: 1,
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      minimum: 1,
      maximum: 100,
      example: 50,
    }),
  );
