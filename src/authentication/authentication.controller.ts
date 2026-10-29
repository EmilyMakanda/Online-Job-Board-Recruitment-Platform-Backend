
import {
  Body,
  Controller,
  Post,
} from '@nestjs/common';

import { AuthenticationService } from './authentication.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';

@Controller('authentication')
export class AuthenticationController {
  constructor(
    private readonly authenticationService: AuthenticationService,
  ) {}

  // Register a new user
  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authenticationService.register(registerDto);
  }

  // Verify the user's email address
  @Post('verify-email')
  verifyEmail(@Body('token') token: string) {
    return this.authenticationService.verifyEmail(token);
  }

  // Resend the email verification link
  @Post('resend-verification')
  resendVerification(@Body('email') email: string) {
    return this.authenticationService.resendVerification(email);
  }

  // Log in an existing user
  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authenticationService.login(loginDto);
  }
}
