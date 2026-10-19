import {
  Controller,
  Post,
  Get,
  Body,
  Query,
} from '@nestjs/common';

import { AuthenticationService } from './authentication.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';

@Controller('authentication')
export class AuthenticationController {
  constructor(
    private readonly authenticationService: AuthenticationService,
  ) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authenticationService.register(dto);
  }

  @Get('verify-email')
  verifyEmail(@Query('token') token: string) {
    return this.authenticationService.verifyEmail(token);
  }

  @Post('resend-verification')
  resendVerification(@Body('email') email: string) {
    return this.authenticationService.resendVerification(email);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authenticationService.login(dto);
  }
}