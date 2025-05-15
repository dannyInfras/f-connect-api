import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: parseInt(process.env.MAIL_PORT || '587', 10),
      secure: false,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD,
      },
    });
  }

  async sendMail(
    to: string,
    subject: string,
    template: string,
    context: Record<string, any>,
  ): Promise<void> {
    const html = this.generateHtmlFromTemplate(template, context);

    await this.transporter.sendMail({
      from: process.env.MAIL_FROM || '"No Reply" <no-reply@example.com>', // Sender address
      to,
      subject,
      html,
    });
  }

  private generateHtmlFromTemplate(
    template: string,
    context: Record<string, any>,
  ): string {
    // Define the email template
    const emailTemplate = `
      <p>Dear {{ companyName }},</p>
      <p>Thank you for registering your company with us. Please verify your registration by clicking the link below:</p>
      <a href="{{ verificationLink }}">Verify Company</a>
      <p>If you did not register this company, please ignore this email.</p>
    `;

    // Replace placeholders with actual values from the context
    return emailTemplate
      .replace('{{ companyName }}', context.companyName || '')
      .replace('{{ verificationLink }}', context.verificationLink || '');
  }
}
