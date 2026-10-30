import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { AuthenticationService } from './authentication.service.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { VerifyEmailDto } from './dto/verify-email.dto.js';
import { ResendVerificationDto } from './dto/resend-verification.dto.js';

@ApiTags('authentication')
@Controller('authentication')
export class AuthenticationController {
  constructor(private readonly authenticationService: AuthenticationService) {}

  // Register a new user
  @Post('register')
  @ApiOperation({ summary: 'Register a new account' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description:
      'Account created; verification code sent or delivery status returned.',
  })
  @ApiResponse({
    status: 400,
    description: 'Registration details are invalid.',
  })
  @ApiResponse({
    status: 409,
    description: 'An account already exists for this email.',
  })
  register(@Body() registerDto: RegisterDto) {
    return this.authenticationService.register(registerDto);
  }

  // Verify the user's email address
  @Post('verify-email')
  @ApiOperation({ summary: 'Verify an account email address' })
  @ApiBody({ type: VerifyEmailDto })
  @ApiResponse({ status: 200, description: 'Email verified successfully.' })
  @ApiResponse({ status: 400, description: 'The code is invalid or expired.' })
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authenticationService.verifyEmail(dto.token);
  }

  // Resend the email verification link
  @Post('resend-verification')
  @ApiOperation({ summary: 'Resend an account verification code' })
  @ApiBody({ type: ResendVerificationDto })
  @ApiResponse({
    status: 200,
    description: 'A new code is sent when the account requires verification.',
  })
  @ApiResponse({ status: 400, description: 'The email address is invalid.' })
  resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authenticationService.resendVerification(dto.email);
  }

  // Log in an existing user
  @Post('login')
  @ApiOperation({ summary: 'Log in and obtain a JWT access token' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful; returns a bearer access token.',
  })
  @ApiResponse({
    status: 401,
    description: 'Credentials are invalid or email is not verified.',
  })
  login(@Body() loginDto: LoginDto) {
    return this.authenticationService.login(loginDto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiHeader({
    name: 'Authorization',
    description: 'JWT access token returned by POST /authentication/login',
    required: true,
    example: 'Bearer YOUR_ACCESS_TOKEN',
  })
  @ApiOperation({ summary: 'Log out the current user' })
  @ApiResponse({
    status: 200,
    description:
      'Logout successful. The client should discard its access token.',
    schema: {
      example: {
        message: 'Logout successful. Please discard your access token.',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'A valid access token is required.',
  })
  logout() {
    return {
      message: 'Logout successful. Please discard your access token.',
    };
  }
}
