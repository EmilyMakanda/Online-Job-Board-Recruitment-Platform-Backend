
import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  private transporterPromise?: Promise<Transporter>;

  private async getTransporter(): Promise<Transporter> {
    if (!this.transporterPromise) {
      this.transporterPromise = nodemailer
        .createTestAccount()
        .then((account) => {
          this.logger.log('Ethereal test account created');

          return nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
              user: account.user,
              pass: account.pass,
            },
          });
        });
    }

    return this.transporterPromise;
  }

  async sendNotificationEmail(
    to: string,
    subject: string,
    message: string,
  ) {
    const transporter = await this.getTransporter();

    const info = await transporter.sendMail({
      from: '"Job Board Notifications" <notifications@example.com>',
      to,
      subject,
      text: message,
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>Job Board Notification</h2>
          <p>${this.escapeHtml(message)}</p>
          <p>Thank you for using our Job Board Recruitment Platform.</p>
        </div>
      `,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);

    this.logger.log(`Email sent. Message ID: ${info.messageId}`);
    this.logger.log(`Preview URL: ${previewUrl}`);

    return {
      message: 'Test email sent successfully',
      messageId: info.messageId,
      previewUrl,
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
