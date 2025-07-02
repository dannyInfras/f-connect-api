import { Injectable, Logger } from '@nestjs/common';
import { readFileSync } from 'fs';
import Handlebars from 'handlebars';
import * as path from 'path';
import { Resend } from 'resend';

export interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType?: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resend: Resend;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      this.logger.error('RESEND_API_KEY not found in environment variables');
      throw new Error('Missing RESEND_API_KEY');
    }

    this.resend = new Resend(apiKey);
  }

  async sendMail(
    to: string,
    subject: string,
    template: string,
    context: Record<string, any>,
    attachments?: EmailAttachment[],
  ): Promise<void> {
    const html = this.generateHtmlFromTemplate(template, context);

    try {
      const result = await this.resend.emails.send({
        from:
          process.env.MAIL_FROM || 'F Career Connect <no-reply@f-career.me>',
        to,
        subject,
        html,
        attachments: attachments?.map((attachment) => ({
          filename: attachment.filename,
          content: attachment.content.toString('base64'),
          type: attachment.contentType || 'application/octet-stream',
        })),
      });

      if (result.error) {
        this.logger.error(`Resend error: ${result.error.message}`);
        throw new Error(result.error.message);
      }

      this.logger.log(`Email sent successfully to ${to}`);
    } catch (error: any) {
      this.logger.error(`Failed to send email to ${to}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Send an email notification when a job's VIP status has expired
   */
  async sendVipExpiredEmail(params: {
    to: string;
    companyName: string;
    jobTitle: string;
    jobId: string;
  }): Promise<void> {
    return this.sendMail(
      params.to,
      `VIP Status Expired: ${params.jobTitle}`,
      'vip-expired',
      {
        companyName: params.companyName,
        jobTitle: params.jobTitle,
        jobId: params.jobId,
        dashboardUrl: `${process.env.FRONTEND_URL}/company/jobs/${params.jobId}`,
      },
    );
  }

  /**
   * Send a warning email when a job's VIP status is about to expire
   */
  async sendVipExpiringWarningEmail(params: {
    to: string;
    companyName: string;
    jobTitle: string;
    jobId: string;
    expiryDate: Date;
  }): Promise<void> {
    return this.sendMail(
      params.to,
      `VIP Status Expiring Soon: ${params.jobTitle}`,
      'vip-expiring-warning',
      {
        companyName: params.companyName,
        jobTitle: params.jobTitle,
        jobId: params.jobId,
        expiryDate: params.expiryDate.toLocaleDateString(),
        dashboardUrl: `${process.env.FRONTEND_URL}/company/jobs/${params.jobId}`,
      },
    );
  }

  private generateHtmlFromTemplate(
    template: string,
    context: Record<string, any>,
  ): string {
    const filename = template.endsWith('.hbs') ? template : `${template}.hbs`;

    const possiblePaths = [
      path.join(__dirname, 'templates', filename),
      path.join(process.cwd(), 'src', 'shared', 'mail', 'templates', filename),
      path.join(
        process.cwd(),
        'dist',
        'src',
        'shared',
        'mail',
        'templates',
        filename,
      ),
    ];

    let fileContent: string | null = null;
    let templatePath: string | null = null;

    for (const p of possiblePaths) {
      try {
        fileContent = readFileSync(p, 'utf-8');
        templatePath = p;
        this.logger.log(`Found template at: ${p}`);
        break;
      } catch (error: any) {
        this.logger.debug(`Template not found at: ${p} - ${error.message}`);
      }
    }

    if (!fileContent || !templatePath) {
      this.logger.error(`Template not found: ${filename}`);
      throw new Error(`Email template not found: ${filename}`);
    }

    const compile = Handlebars.compile(fileContent);
    return compile(context);
  }
}
