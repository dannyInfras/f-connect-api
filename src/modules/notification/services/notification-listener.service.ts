import { Injectable, OnModuleInit } from '@nestjs/common';

import { ApplicationStatus } from '@/modules/applications/enums/application-status.enum';
import { EventEmitterService } from '@/shared/events/event-emitter.service';
import { AppLogger } from '@/shared/logger/logger.service';

import { NotificationService } from './notification.service';

export interface ApplicationStatusChangeEventData {
  applicationId: number;
  userId: number;
  jobTitle: string;
  oldStatus: ApplicationStatus;
  newStatus: ApplicationStatus;
  companyName: string;
}

@Injectable()
export class NotificationListenerService implements OnModuleInit {
  constructor(
    private readonly eventEmitter: EventEmitterService,
    private readonly notificationService: NotificationService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(NotificationListenerService.name);
  }

  onModuleInit() {
    this.eventEmitter
      .listen<ApplicationStatusChangeEventData>('application.status.changed')
      .subscribe({
        next: (data) => this.handleApplicationStatusChange(data),
        error: (error) => {
          this.logger.error(
            {
              requestID: 'internal',
              url: 'internal',
              ip: '0.0.0.0',
              user: null,
            },
            `Error in application status change listener: ${error.message}`,
          );
        },
      });
  }

  /**
   * Handle application status change events and create notifications
   */
  private async handleApplicationStatusChange(
    data: ApplicationStatusChangeEventData,
  ): Promise<void> {
    const logCtx = {
      requestID: 'internal',
      url: 'internal',
      ip: '0.0.0.0',
      user: null,
    };

    try {
      this.logger.log(
        logCtx,
        `Handling application status change for application ${data.applicationId}: ${data.oldStatus} -> ${data.newStatus}`,
      );

      const { title, content } = this.createNotificationContent(data);

      await this.notificationService.createNotification({
        userId: data.userId,
        title,
        content,
      });

      this.logger.log(
        logCtx,
        `Successfully created notification for user ${data.userId} regarding application ${data.applicationId}`,
      );
    } catch (error) {
      this.logger.error(
        logCtx,
        `Failed to create notification for application status change: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  /**
   * Create notification title and content based on status change
   */
  private createNotificationContent(data: ApplicationStatusChangeEventData): {
    title: string;
    content: string;
  } {
    const { jobTitle, newStatus, companyName } = data;

    switch (newStatus) {
      case ApplicationStatus.IN_REVIEW:
        return {
          title: 'The HR team has seen your application',
          content: `Your application for "${jobTitle}" at ${companyName} has been viewed by the HR team. They will be in touch with you regarding next steps.`,
        };

      case ApplicationStatus.IN_SHORTLIST:
        return {
          title: 'Application Reviewed',
          content: `Your application for "${jobTitle}" at ${companyName} has been reviewed. The company will be in touch with you regarding next steps.`,
        };

      case ApplicationStatus.INTERVIEW:
        return {
          title: 'Interview Scheduled!',
          content: `Congratulations! Your application for "${jobTitle}" at ${companyName} has progressed to the interview stage. You should expect to hear from the company soon regarding interview details.`,
        };

      case ApplicationStatus.HIRED:
        return {
          title: 'Congratulations - You Got the Job!',
          content: `Excellent news! You have been selected for the position "${jobTitle}" at ${companyName}. The company will be in touch with you regarding next steps and onboarding details.`,
        };

      case ApplicationStatus.REJECTED:
        return {
          title: 'Application Update',
          content: `Thank you for your interest in "${jobTitle}" at ${companyName}. Unfortunately, they have decided to move forward with other candidates. Keep applying - the right opportunity is out there!`,
        };

      default:
        return {
          title: 'Application Status Update',
          content: `Your application for "${jobTitle}" at ${companyName} has been updated to ${newStatus}.`,
        };
    }
  }
}
