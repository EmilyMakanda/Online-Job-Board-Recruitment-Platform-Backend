import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly configService: ConfigService) {}

  private createTransporter(): Transporter {
    const user = this.configService.get<string>('SMTP_USER');
    const password = this.configService.get<string>('SMTP_PASSWORD');
    const clientId = this.configService.get<string>('SMTP_CLIENT_ID');
    const clientSecret = this.configService.get<string>('SMTP_CLIENT_SECRET');
    const refreshToken = this.configService.get<string>('SMTP_REFRESH_TOKEN');
    const host = this.configService.get<string>('SMTP_HOST', 'smtp.gmail.com');
    const port = Number(this.configService.get<string>('SMTP_PORT') ?? 465);
    const secureSetting = this.configService.get<string>('SMTP_SECURE');
    const secure =
      secureSetting === undefined
        ? port === 465
        : secureSetting.toLowerCase() === 'true';

    if (!user) {
      throw new Error(
        'SMTP configuration is missing. Set SMTP_USER and SMTP_PASSWORD or configure Gmail OAuth.',
      );
    }

    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      throw new Error('SMTP_PORT must be a valid port number.');
    }

    const auth = password
      ? { user, pass: password }
      : clientId && clientSecret && refreshToken
        ? {
            type: 'OAuth2' as const,
            user,
            clientId,
            clientSecret,
            refreshToken,
          }
        : undefined;

    if (!auth) {
      throw new Error(
        'SMTP credentials are incomplete. Set SMTP_PASSWORD or SMTP_CLIENT_ID, SMTP_CLIENT_SECRET and SMTP_REFRESH_TOKEN.',
      );
    }

    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth,
    });
  }

  async sendEmail(to: string, subject: string, text: string, html: string) {
    const transporter = this.createTransporter();
    const from =
      this.configService.get<string>('SMTP_FROM') ??
      this.configService.get<string>('SMTP_USER');

    try {
      return await transporter.sendMail({
        from,
        to,
        subject,
        text,
        html,
      });
    } finally {
      transporter.close();
    }
  }

  async sendNotificationEmail(to: string, subject: string, message: string) {
    const info = await this.sendEmail(
      to,
      subject,
      message,
      `
        <div style="font-family: Arial, sans-serif;">
          <h2>${this.escapeHtml(subject)}</h2>
          <p>${this.escapeHtml(message)}</p>
          <p>Thank you for using our Job Board Recruitment Platform.</p>
        </div>
      `,
    );

    this.logger.log(`Email sent. Message ID: ${info.messageId}`);

    return {
      messageId: info.messageId,
    };
  }

  async sendTestEmail(to: string) {
    return this.sendNotificationEmail(
      to,
      'Job Board Test Email',
      'Your email notification system is working successfully!',
    );
  }

  private escapeHtml(value: string): string {
    return value.replace(/[&<>"']/g, (character) => {
      const entities: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      };

      return entities[character];
    });
  }
}
