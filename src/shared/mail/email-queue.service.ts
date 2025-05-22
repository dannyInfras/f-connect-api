import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job, Queue, Worker } from 'bullmq';
import CircuitBreaker from 'opossum';

import { MailService } from './mail.service';

interface VerificationEmailPayload {
  to: string;
  token: string;
  [key: string]: unknown;
}

const QUEUE_NAME = 'email';

@Injectable()
export class EmailQueueService {
  private readonly queue: Queue<VerificationEmailPayload>;
  private readonly logger = new Logger(EmailQueueService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {
    const connection = {
      host: this.configService.get<string>('redis.host'),
      port: this.configService.get<number>('redis.port'),
    };

    this.logger.log(
      `Initializing Redis connection to ${connection.host}:${connection.port}`,
    );

    this.queue = new Queue<VerificationEmailPayload>(QUEUE_NAME, {
      connection,
    });
    // Configure circuit breaker around the actual email sending operation
    const breaker = new CircuitBreaker(
      (jobData: VerificationEmailPayload) =>
        this.sendVerificationEmail(jobData),
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
    new Worker<VerificationEmailPayload>(
      QUEUE_NAME,
      async (job: Job<VerificationEmailPayload>) => {
        this.logger.log(
          `Processing job ${job.id} with data: ${JSON.stringify(job.data)}`,
        );
        try {
          await breaker.fire(job.data);
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
}
