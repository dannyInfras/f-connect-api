import { Injectable, Logger } from '@nestjs/common';
import { readFileSync } from 'fs';
import Handlebars from 'handlebars';
import * as nodemailer from 'nodemailer';
import * as path from 'path';

export interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType?: string;
}

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);

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
    attachments?: EmailAttachment[],
  ): Promise<void> {
    const html = this.generateHtmlFromTemplate(template, context);

    const mailOptions: nodemailer.SendMailOptions = {
      from: process.env.MAIL_FROM || '"No Reply" <no-reply@example.com>', // Sender address
      to,
      subject,
      html,
    };

    // Add attachments if provided
    if (attachments && attachments.length > 0) {
      mailOptions.attachments = attachments.map((attachment) => ({
        filename: attachment.filename,
        content: attachment.content,
        contentType: attachment.contentType,
      }));

      this.logger.log(
        `Sending email with ${attachments.length} attachment(s) to ${to}`,
      );
    }

    await this.transporter.sendMail(mailOptions);
  }

  private generateHtmlFromTemplate(
    template: string,
    context: Record<string, any>,
  ): string {
    /*
     * Render an html string from a Handlebars (*.hbs) file located under
     * src/shared/mail/templates. The template argument can be provided
     * with or without extension.
     */

    const filename = template.endsWith('.hbs') ? template : `${template}.hbs`;

    // Try multiple possible paths to find the template
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
