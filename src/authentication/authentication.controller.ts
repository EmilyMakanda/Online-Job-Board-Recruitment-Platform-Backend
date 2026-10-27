``
import {
  Body,
  Controller,
  Post,
} from '@nestjs/common';

import { AuthenticationService } from './authentication.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { ApiOperation, ApiTags,ApiParam } from '@nestjs/swagger';
@ApiTags('authentication')
@Controller('authentication')
export class AuthenticationController {
  constructor(
    private readonly authenticationService: AuthenticationService,
  ) {}

  // Register a new user
  @Post('register')
  @ApiOperation({summary: 'Registering user'})
  @ApiParam({name:'USERID',description: 'The userid'})
  register(@Body() registerDto: RegisterDto) {
    return this.authenticationService.register(registerDto);
  }

  // Verify the user's email address
  @Post('verify-email')
  @ApiOperation({summary: 'verifying user address'})
  @ApiParam({name:'USERID',description: 'The userid'})
  verifyEmail(@Body('token') token: string) {
    return this.authenticationService.verifyEmail(token);
  }

  // Resend the email verification link
  @Post('resend-verification')
  @ApiOperation({summary: 'resending email verification link'})
  @ApiParam({name:'USERID',description: 'The userid'})
  resendVerification(@Body('email') email: string) {
    return this.authenticationService.resendVerification(email);
  }

  // Log in an existing user
  @Post('login')
  @ApiOperation({summary: 'user login'})
  @ApiParam({name:'USERID',description: 'The userid'})
  login(@Body() loginDto: LoginDto) {
    return this.authenticationService.login(loginDto);
  }
}
