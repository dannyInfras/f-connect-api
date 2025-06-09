import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job, Queue, Worker } from 'bullmq';
import CircuitBreaker from 'opossum';

import { JobApplicationEmailType } from '@/modules/applications/types';

import { SupabaseService } from '../storage/supabase.service';
import {
  JobApplicationEmailPayload,
  VerificationEmailPayload,
} from './interfaces';
import { EmailAttachment, MailService } from './mail.service';

type EmailPayload = VerificationEmailPayload | JobApplicationEmailPayload;

const QUEUE_NAME = 'email';

@Injectable()
export class EmailQueueService {
  private readonly queue: Queue<EmailPayload>;
  private readonly logger = new Logger(EmailQueueService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
    private readonly supabaseService: SupabaseService,
  ) {
    const connection = {
      host: this.configService.get<string>('redis.host'),
      port: this.configService.get<number>('redis.port'),
    };

    this.logger.log(
      `Initializing Redis connection to ${connection.host}:${connection.port}`,
    );

    this.queue = new Queue<EmailPayload>(QUEUE_NAME, {
      connection,
    });
    // Configure circuit breaker around the actual email sending operation
    const breaker = new CircuitBreaker(
      (jobData: EmailPayload, jobType: string) =>
        this.processEmailJob(jobData, jobType),
      {
        timeout: 10000, // 10s
        errorThresholdPercentage: 50,
        resetTimeout: 30_000, // 30s
      },
    );

    breaker.on('open', () => this.logger.warn('Email circuit breaker opened'));
    breaker.on('halfOpen', () =>
      this.logger.warn('Email circuit breaker half-open'),
    );
    breaker.on('close', () => this.logger.log('Email circuit breaker closed'));

    // Create Worker that processes jobs using the circuit breaker
    new Worker<EmailPayload>(
      QUEUE_NAME,
      async (job: Job<EmailPayload>) => {
        this.logger.log(
          `Processing job ${job.id} with data: ${JSON.stringify(job.data)}`,
        );
        try {
          await breaker.fire(job.data, job.name);
          this.logger.log(`Job ${job.id} completed successfully`);
        } catch (error: any) {
          this.logger.error(`Error processing job ${job.id}: ${error.message}`);
          throw error;
        }
      },
      { connection },
    );
  }

  /**
   * Add a verification email job to the queue.
   */
  async queueVerificationEmail(to: string, token: string): Promise<void> {
    try {
      const job = await this.queue.add('send-verification', { to, token });
      this.logger.log(
        `Email verification job added to queue with ID: ${job.id}`,
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to add email verification job to queue: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Add a job application success email job to the queue.
   */
  async queueJobApplicationEmail(
    jobApplicationEmailType: JobApplicationEmailType,
  ): Promise<void> {
    try {
      const job = await this.queue.add('send-job-application', {
        ...jobApplicationEmailType,
      });
      this.logger.log(
        `Job application email job added to queue with ID: ${job.id}`,
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to add job application email job to queue: ${error.message}`,
      );
      throw error;
    }
  }

  // Internal method that routes email jobs to appropriate handlers
  private async processEmailJob(
    jobData: EmailPayload,
    jobType: string,
  ): Promise<void> {
    switch (jobType) {
      case 'send-verification':
        await this.sendVerificationEmail(jobData as VerificationEmailPayload);
        break;
      case 'send-job-application':
        await this.sendJobApplicationEmail(
          jobData as JobApplicationEmailPayload,
        );
        break;
      default:
        throw new Error(`Unknown job type: ${jobType}`);
    }
  }

  // Internal method that composes actual email body and invokes MailService
  private async sendVerificationEmail({
    to,
    token,
  }: VerificationEmailPayload): Promise<void> {
    this.logger.log(`Sending verification email to ${to}`);
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    try {
      await this.mailService.sendMail(
        to,
        'Verify your email address',
        'verify-email',
        {
          verificationLink,
        },
      );
      this.logger.log(`Verification email sent to ${to} successfully`);
    } catch (error: any) {
      this.logger.error(
        `Failed to send verification email to ${to}: ${error.message}`,
      );
      throw error;
    }
  }

  // Internal method for sending job application success emails
  private async sendJobApplicationEmail(
    jobApplicationEmailType: JobApplicationEmailType,
  ): Promise<void> {
    this.logger.log(
      `Sending job application success email to ${jobApplicationEmailType.to}`,
    );
    this.logger.log(
      `Email payload: cvSubmitted=${jobApplicationEmailType.cvSubmitted}, cvFileUrl=${jobApplicationEmailType.cvFileUrl}`,
    );

    try {
      const attachments: EmailAttachment[] = [];

      // Download and attach CV if available
      if (
        jobApplicationEmailType.cvFileUrl &&
        jobApplicationEmailType.cvSubmitted
      ) {
        this.logger.log(
          `Attempting to download CV file: ${jobApplicationEmailType.cvFileUrl}`,
        );
        const cvBuffer = await this.supabaseService.downloadFile(
          jobApplicationEmailType.cvFileUrl as string,
        );

        if (cvBuffer) {
          const fileMetadata = await this.supabaseService.getFileMetadata(
            jobApplicationEmailType.cvFileUrl as string,
          );

          attachments.push({
            filename: `CV_${jobApplicationEmailType.applicantName.replace(/\s+/g, '_')}.pdf`,
            content: cvBuffer,
            contentType: fileMetadata?.mimeType || 'application/pdf',
          });

          this.logger.log(
            `CV file attached successfully: ${jobApplicationEmailType.cvFileUrl}`,
          );
        } else {
          this.logger.warn(
            `Failed to download CV file: ${jobApplicationEmailType.cvFileUrl}. Email will be sent without attachment.`,
          );
        }
      }

      await this.mailService.sendMail(
        jobApplicationEmailType.to,
        `Application Submitted: ${jobApplicationEmailType.jobTitle} at ${jobApplicationEmailType.companyName}`,
        'job-application-success',
        {
          applicantName: jobApplicationEmailType.applicantName,
          jobTitle: jobApplicationEmailType.jobTitle,
          companyName: jobApplicationEmailType.companyName,
          appliedDate: jobApplicationEmailType.appliedDate,
          cvSubmitted: jobApplicationEmailType.cvSubmitted,
          coverLetter: jobApplicationEmailType.coverLetter || '',
        },
        attachments.length > 0 ? attachments : undefined,
      );
      this.logger.log(
        `Job application email sent to ${jobApplicationEmailType.to} successfully`,
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to send job application email to ${jobApplicationEmailType.to}: ${error.message}`,
      );
      throw error;
    }
  }
}
