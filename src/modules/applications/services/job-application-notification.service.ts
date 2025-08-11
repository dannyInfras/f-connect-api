import { Injectable } from '@nestjs/common';

import { ROLE } from '@/modules/auth/constants/role.constant';
import { NotificationService } from '@/modules/notification/services/notification.service';
import { AppLogger } from '@/shared/logger/logger.service';
import { EmailQueueService } from '@/shared/mail/email-queue.service';

import {
  ApplicationWithFullRelations,
  JobApplicationEmailType,
} from '../types';

@Injectable()
export class JobApplicationNotificationService {
  constructor(
    private readonly emailQueue: EmailQueueService,
    private readonly notificationService: NotificationService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(JobApplicationNotificationService.name);
  }

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

  /**
   * Send in-app notifications to company recruiters when a new job application is received.
   */
  async notifyCompanyAboutNewApplication(
    applicationWithFullDetails: ApplicationWithFullRelations,
    applicationId: number,
  ): Promise<void> {
    try {
      if (applicationWithFullDetails?.job?.company?.users) {
        // Filter company users by recruiter roles
        const companyRecruiters =
          applicationWithFullDetails.job.company.users.filter(
            (companyUser) =>
              companyUser.roles.includes(ROLE.RECRUITER) ||
              companyUser.roles.includes(ROLE.ADMIN_RECRUITER),
          );

        // Create notifications for each recruiter
        const notificationPromises = companyRecruiters.map((recruiter) =>
          this.notificationService.createNotification({
            userId: recruiter.id,
            title: 'New Job Application Received',
            content: `${applicationWithFullDetails.user.name} has applied for the position "${applicationWithFullDetails.job.title}" at your company.`,
          }),
        );

        await Promise.allSettled(notificationPromises);

        this.logger.log(
          {
            requestID: 'internal',
            url: 'internal',
            ip: '0.0.0.0',
            user: null,
          },
          `Created notifications for ${companyRecruiters.length} company recruiters for application ${applicationId}`,
        );
      }
    } catch (error: any) {
      this.logger.error(
        {
          requestID: 'internal',
          url: 'internal',
          ip: '0.0.0.0',
          user: null,
        },
        `Failed to create company notifications for application ${applicationId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
