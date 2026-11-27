import {
  Body,
  Controller,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';

import { AuthenticationService } from './authentication.service.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { VerifyEmailDto } from './dto/verify-email.dto.js';
import { ResendVerificationDto } from './dto/resend-verification.dto.js';
import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';

interface AuthenticatedRequest extends Request {
  user: { sub: number };
}

@ApiTags('authentication')
@Controller('authentication')
export class AuthenticationController {
  constructor(private readonly authenticationService: AuthenticationService) {}

  // Register a new user
  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
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

  @Post('register/employer')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Register an employer account',
    description:
      'Creates an employer account with the employer role assigned by the backend. Register the associated company separately.',
  })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description:
      'Employer account created; verification code delivery status returned.',
  })
  @ApiResponse({
    status: 400,
    description: 'Registration details are invalid.',
  })
  @ApiResponse({
    status: 409,
    description: 'An account already exists for this email.',
  })
  registerEmployer(@Body() registerDto: RegisterDto) {
    return this.authenticationService.registerEmployer(registerDto);
  }

  // Verify the user's email address
  @Post('verify-email')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Verify an account email address' })
  @ApiBody({ type: VerifyEmailDto })
  @ApiResponse({ status: 200, description: 'Email verified successfully.' })
  @ApiResponse({ status: 400, description: 'The code is invalid or expired.' })
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authenticationService.verifyEmail(dto.token);
  }

  // Resend the email verification link
  @Post('resend-verification')
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
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
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Log in and obtain a JWT access token' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful; returns a bearer access token.',
  })
  @ApiResponse({
    status: 401,
    description:
      'Credentials are invalid, email is not verified, or the account is inactive.',
  })
  login(@Body() loginDto: LoginDto) {
    return this.authenticationService.login(loginDto);
  }

  @Post('password/forgot')
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @ApiOperation({ summary: 'Request a password reset email' })
  @ApiBody({ type: ForgotPasswordDto })
  requestPasswordReset(@Body() dto: ForgotPasswordDto) {
    return this.authenticationService.requestPasswordReset(dto.email);
  }

  @Post('password/reset')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Reset a password with a one-time email token' })
  @ApiBody({ type: ResetPasswordDto })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authenticationService.resetPassword(dto.token, dto.password);
  }

  @Patch('password')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change the authenticated user password' })
  @ApiBody({ type: ChangePasswordDto })
  changePassword(
    @Body() dto: ChangePasswordDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.authenticationService.changePassword(
      req.user.sub,
      dto.currentPassword,
      dto.newPassword,
    );
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiBearerAuth()
  @ApiHeader({
    name: 'Authorization',
    description: 'JWT access token returned by POST /api/v1/authentication/login',
    required: true,
    example: 'Bearer YOUR_ACCESS_TOKEN',
  })
  @ApiOperation({ summary: 'Log out the current user' })
  @ApiResponse({
    status: 200,
    description:
      'Logout successful. All access tokens issued before logout are revoked.',
    schema: {
      example: {
        message: 'Logout successful. All active access tokens were revoked.',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'A valid access token is required.',
  })
  logout(@Req() req: AuthenticatedRequest) {
    return this.authenticationService.logout(req.user.sub);
  }
}
