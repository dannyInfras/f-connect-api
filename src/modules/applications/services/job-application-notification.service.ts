import { Injectable } from '@nestjs/common';

import { EmailQueueService } from '@/shared/mail/email-queue.service';

import { JobApplicationEmailType } from '../types';

@Injectable()
export class JobApplicationNotificationService {
  constructor(private readonly emailQueue: EmailQueueService) {}

  /**
   * Send a success notification email after a user successfully applies for a job.
   */
  async sendApplicationSuccessEmail(
    applicationData: JobApplicationEmailType,
  ): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const formattedDate = new Date(
      applicationData.appliedDate,
    ).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    await this.emailQueue.queueJobApplicationEmail({
      ...applicationData,
    });
  }
}
