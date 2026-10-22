
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('MAIL_HOST', 'smtp.gmail.com'),
      port: Number(this.configService.get('MAIL_PORT', 465)),
      secure: true,
      auth: {
        user: this.configService.get<string>('MAIL_USER'),
        pass: this.configService.get<string>('MAIL_PASSWORD'),
      },
    });
  }

  async sendNotificationEmail(
    to: string,
    subject: string,
    message: string,
  ) {
    const from = this.configService.get<string>('MAIL_USER');

    const info = await this.transporter.sendMail({
      from: `"Job Board Notifications" <${from}>`,
      to,
      subject,
      text: message,
      html: `<h2>Hey emily ,</h2><p>${this.escapeHtml(message)}</p>`,
    });

    console.log('Email accepted by SMTP server:', info.messageId);

    return {
      message: 'Email accepted by Gmail SMTP',
      messageId: info.messageId,
    };
  }

  async sendTestEmail(to: string) {
    return this.sendNotificationEmail(
      to,
      'Account created',
      'Your account has been created , thank you!',
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
