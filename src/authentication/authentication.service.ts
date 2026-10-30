import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import * as bcrypt from 'bcrypt';
import { createHash, randomInt } from 'node:crypto';
import nodemailer from 'nodemailer';

import { User } from './entities/user.entity.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';

@Injectable()
export class AuthenticationService {
  private readonly logger = new Logger(AuthenticationService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // Hash the OTP before storing it in Oracle.
  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  // Generate a random six-digit OTP, including leading zeros.
  private generateVerificationCode(): string {
    return randomInt(0, 1_000_000)
      .toString()
      .padStart(6, '0');
  }

  // Gmail SMTP using OAuth 2.0.
  private createEmailTransporter() {
    const user = this.configService.get<string>('SMTP_USER');
    const clientId = this.configService.get<string>('SMTP_CLIENT_ID');
    const clientSecret = this.configService.get<string>(
      'SMTP_CLIENT_SECRET',
    );
    const refreshToken = this.configService.get<string>(
      'SMTP_REFRESH_TOKEN',
    );

    if (!user || !clientId || !clientSecret || !refreshToken) {
      throw new Error(
        'Gmail OAuth configuration is missing. Check SMTP_USER, SMTP_CLIENT_ID, SMTP_CLIENT_SECRET and SMTP_REFRESH_TOKEN in your .env file.',
      );
    }

    return nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        type: 'OAuth2',
        user,
        clientId,
        clientSecret,
        refreshToken,
      },
    });
  }

  // Send the six-digit OTP to the user's email address.
  private async sendVerificationEmail(
    email: string,
    otp: string,
  ): Promise<boolean> {
    let transporter:
      | ReturnType<typeof nodemailer.createTransport>
      | undefined;

    try {
      transporter = this.createEmailTransporter();

      const sender =
        this.configService.get<string>('SMTP_FROM') ??
        this.configService.get<string>('SMTP_USER');

      await transporter.sendMail({
        from: sender,
        to: email,
        subject: 'Your Job Board Verification Code',

        text: [
          'Welcome to Online Job Board!',
          '',
          `Your six-digit verification code is: ${otp}`,
          '',
          'This code expires in 10 minutes.',
          'If you did not create this account, you can ignore this email.',
        ].join('\n'),

        html: `
          <h2>Welcome to Online Job Board!</h2>
          <p>Thank you for registering.</p>
          <p>Enter this six-digit code to verify your email:</p>
          <h1 style="letter-spacing: 8px;">${otp}</h1>
          <p>This code expires in 10 minutes.</p>
          <p>If you did not create this account, ignore this email.</p>
        `,
      });

      return true;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);

      this.logger.error(`Failed to send verification OTP: ${message}`);
      return false;
    } finally {
      transporter?.close();
    }
  }

  // Register a new user with the selected role and send an OTP.
  async register(dto: RegisterDto) {
    const name = dto.name?.trim();
    const email = dto.email?.trim().toLowerCase();
    const password = dto.password;
    const role = dto.role;

    if (!name || !email || !password || !role) {
      throw new BadRequestException(
        'Name, email, password and role are required.',
      );
    }

    if (!['job_seeker', 'employer'].includes(role)) {
      throw new BadRequestException(
        'Role must be either job_seeker or employer.',
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BadRequestException(
        'Please enter a valid email address.',
      );
    }

    if (password.length < 8) {
      throw new BadRequestException(
        'Password must contain at least 8 characters.',
      );
    }

    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException(
        'An account with this email already exists. Try logging in or requesting a new verification code.',
      );
    }

    const otp = this.generateVerificationCode();

    const user = this.userRepository.create({
      name,
      email,
      password: await bcrypt.hash(password, 12),
      role,
      isEmailVerified: 0,
      emailVerificationTokenHash: this.hashToken(otp),
      emailVerificationTokenExpiresAt: new Date(
        Date.now() + 10 * 60 * 1000,
      ),
    });

    // Save the user account in Oracle.
    const savedUser = await this.userRepository.save(user);

    // Send the OTP to the registered email address.
    const emailSent = await this.sendVerificationEmail(
      savedUser.email,
      otp,
    );

    return {
      message: emailSent
        ? 'Registration successful. A six-digit OTP has been sent to your email. Enter it to verify your account.'
        : 'Your account was created, but the OTP email could not be sent. Please check your email settings and request a new code.',
      emailSent,
      user: {
        id: savedUser.id,
        name: savedUser.name,
        email: savedUser.email,
        role: savedUser.role,
        isEmailVerified: Boolean(savedUser.isEmailVerified),
      },
    };
  }

  // Verify the six-digit OTP entered by the user.
  async verifyEmail(otp: string) {
    if (!otp || !/^\d{6}$/.test(otp)) {
      throw new BadRequestException(
        'Please enter a valid six-digit OTP.',
      );
    }

    const user = await this.userRepository.findOne({
      where: {
        emailVerificationTokenHash: this.hashToken(otp),
      },
    });

    if (!user) {
      throw new BadRequestException(
        'Invalid verification code.',
      );
    }

    if (
      !user.emailVerificationTokenExpiresAt ||
      user.emailVerificationTokenExpiresAt.getTime() < Date.now()
    ) {
      throw new BadRequestException(
        'Your verification code has expired. Please request a new code.',
      );
    }

    user.isEmailVerified = 1;
    user.emailVerificationTokenHash = null;
    user.emailVerificationTokenExpiresAt = null;

    await this.userRepository.save(user);

    return {
      message: 'Email verified successfully. You can now log in.',
    };
  }

  // Resend a new OTP if the user has not verified their email.
  async resendVerification(emailInput: string) {
    const email = emailInput?.trim().toLowerCase();

    if (!email) {
      throw new BadRequestException('Email is required.');
    }

    const user = await this.userRepository.findOne({
      where: { email },
    });

    // Avoid revealing whether an account exists.
    if (!user || user.isEmailVerified === 1) {
      return {
        message:
          'If the account exists and needs verification, a new verification code will be sent.',
      };
    }

    const otp = this.generateVerificationCode();

    user.emailVerificationTokenHash = this.hashToken(otp);
    user.emailVerificationTokenExpiresAt = new Date(
      Date.now() + 10 * 60 * 1000,
    );

    await this.userRepository.save(user);

    const emailSent = await this.sendVerificationEmail(
      user.email,
      otp,
    );

    return {
      message: emailSent
        ? 'A new six-digit verification code has been sent to your email.'
        : 'The verification code could not be sent. Please try again later.',
      emailSent,
    };
  }

  // Log in only after the email has been verified.
  async login(dto: LoginDto) {
    const email = dto.email?.trim().toLowerCase();
    const password = dto.password;

    if (!email || !password) {
      throw new BadRequestException(
        'Email and password are required.',
      );
    }

    // Explicitly select the password because the entity excludes it by default.
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();

    if (!user) {
      throw new UnauthorizedException(
        'Invalid email or password.',
      );
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.password,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException(
        'Invalid email or password.',
      );
    }

    if (user.isEmailVerified !== 1) {
      throw new UnauthorizedException(
        'Please verify your email before logging in.',
      );
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      message: 'Login successful.',
      access_token: accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: true,
      },
    };
  }
}