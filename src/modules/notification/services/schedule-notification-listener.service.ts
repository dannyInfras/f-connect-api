import { Injectable, OnModuleInit } from '@nestjs/common';

import { EventEmitterService } from '@/shared/events/event-emitter.service';
import { AppLogger } from '@/shared/logger/logger.service';

import { NotificationService } from './notification.service';

export interface ScheduleEventCreatedEvent {
  event: {
    id: string;
    title: string;
    type: string;
    startsAt: Date;
    endsAt: Date;
    location?: string;
    notes?: string;
    companyId: string;
    createdBy: number;
  };
  participants: Array<{
    userId: number;
    role: string;
    user?: {
      id: number;
      name: string;
      email: string;
    };
  }>;
}

export interface ScheduleEventUpdatedEvent {
  event: {
    id: string;
    title: string;
    type: string;
    startsAt: Date;
    endsAt: Date;
    location?: string;
    notes?: string;
    companyId: string;
    createdBy: number;
  };
  previousEvent: Partial<{
    title: string;
    startsAt: Date;
    endsAt: Date;
    location?: string;
    notes?: string;
  }>;
  participants: Array<{
    userId: number;
    role: string;
    user?: {
      id: number;
      name: string;
      email: string;
    };
  }>;
}

export interface ScheduleEventCancelledEvent {
  event: {
    id: string;
    title: string;
    type: string;
    startsAt: Date;
    endsAt: Date;
    location?: string;
    notes?: string;
    companyId: string;
    createdBy: number;
  };
  participants: Array<{
    userId: number;
    role: string;
    user?: {
      id: number;
      name: string;
      email: string;
    };
  }>;
}

export interface ParticipantResponseUpdatedEvent {
  event: {
    id: string;
    title: string;
    type: string;
    startsAt: Date;
    endsAt: Date;
    location?: string;
    notes?: string;
    companyId: string;
    createdBy: number;
  };
  participant: {
    userId: number;
    role: string;
    response: string;
    user?: {
      id: number;
      name: string;
      email: string;
    };
  };
  participants: Array<{
    userId: number;
    role: string;
    user?: {
      id: number;
      name: string;
      email: string;
    };
  }>;
  previousResponse: string;
}

@Injectable()
export class ScheduleNotificationListenerService implements OnModuleInit {
  constructor(
    private readonly eventEmitter: EventEmitterService,
    private readonly notificationService: NotificationService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(ScheduleNotificationListenerService.name);
  }

  onModuleInit() {
    // Listen for schedule event created
    this.eventEmitter
      .listen<ScheduleEventCreatedEvent>('schedule.event.created')
      .subscribe({
        next: (data) => this.handleScheduleEventCreated(data),
        error: (error) => {
          this.logger.error(
            {
              requestID: 'internal',
              url: 'internal',
              ip: '0.0.0.0',
              user: null,
            },
            `Error in schedule event created listener: ${error.message}`,
          );
        },
      });

    // Listen for schedule event updated
    this.eventEmitter
      .listen<ScheduleEventUpdatedEvent>('schedule.event.updated')
      .subscribe({
        next: (data) => this.handleScheduleEventUpdated(data),
        error: (error) => {
          this.logger.error(
            {
              requestID: 'internal',
              url: 'internal',
              ip: '0.0.0.0',
              user: null,
            },
            `Error in schedule event updated listener: ${error.message}`,
          );
        },
      });

    // Listen for schedule event cancelled
    this.eventEmitter
      .listen<ScheduleEventCancelledEvent>('schedule.event.cancelled')
      .subscribe({
        next: (data) => this.handleScheduleEventCancelled(data),
        error: (error) => {
          this.logger.error(
            {
              requestID: 'internal',
              url: 'internal',
              ip: '0.0.0.0',
              user: null,
            },
            `Error in schedule event cancelled listener: ${error.message}`,
          );
        },
      });

    // Listen for participant response updates
    this.eventEmitter
      .listen<ParticipantResponseUpdatedEvent>('schedule.participant.response')
      .subscribe({
        next: (data) => this.handleParticipantResponseUpdated(data),
        error: (error) => {
          this.logger.error(
            {
              requestID: 'internal',
              url: 'internal',
              ip: '0.0.0.0',
              user: null,
            },
            `Error in participant response listener: ${error.message}`,
          );
        },
      });
  }

  /**
   * Handle schedule event created and create notifications for participants
   */
  private async handleScheduleEventCreated(
    data: ScheduleEventCreatedEvent,
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
        `Handling schedule event created: ${data.event.title}`,
      );

      // Create notifications for all participants except the event creator
      let notificationCount = 0;
      for (const participant of data.participants) {
        // Skip the event creator - they don't need notification about their own event
        if (participant.userId === data.event.createdBy) {
          continue;
        }

        const { title, content } = this.createEventCreatedNotificationContent(
          data.event,
          participant,
        );

        await this.notificationService.createNotification({
          userId: participant.userId,
          title,
          content,
        });

        notificationCount++;
      }

      this.logger.log(
        logCtx,
        `Successfully created notifications for ${notificationCount} participants for event: ${data.event.title}`,
      );
    } catch (error) {
      this.logger.error(
        logCtx,
        `Failed to create notifications for schedule event created: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  /**
   * Handle schedule event updated and create notifications for participants
   */
  private async handleScheduleEventUpdated(
    data: ScheduleEventUpdatedEvent,
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
        `Handling schedule event updated: ${data.event.title}`,
      );

      // Create notifications for all participants except the event creator
      let notificationCount = 0;
      for (const participant of data.participants) {
        // Skip the event creator - they don't need notification about their own event updates
        if (participant.userId === data.event.createdBy) {
          continue;
        }

        const { title, content } = this.createEventUpdatedNotificationContent(
          data.event,
          data.previousEvent,
          participant,
        );

        await this.notificationService.createNotification({
          userId: participant.userId,
          title,
          content,
        });

        notificationCount++;
      }

      this.logger.log(
        logCtx,
        `Successfully created notifications for ${notificationCount} participants for event update: ${data.event.title}`,
      );
    } catch (error) {
      this.logger.error(
        logCtx,
        `Failed to create notifications for schedule event updated: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  /**
   * Handle schedule event cancelled and create notifications for participants
   */
  private async handleScheduleEventCancelled(
    data: ScheduleEventCancelledEvent,
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
        `Handling schedule event cancelled: ${data.event.title}`,
      );

      // Create notifications for all participants except the event creator
      let notificationCount = 0;
      for (const participant of data.participants) {
        // Skip the event creator - they don't need notification about their own event cancellation
        if (participant.userId === data.event.createdBy) {
          continue;
        }

        const { title, content } = this.createEventCancelledNotificationContent(
          data.event,
          participant,
        );

        await this.notificationService.createNotification({
          userId: participant.userId,
          title,
          content,
        });

        notificationCount++;
      }

      this.logger.log(
        logCtx,
        `Successfully created notifications for ${notificationCount} participants for event cancellation: ${data.event.title}`,
      );
    } catch (error) {
      this.logger.error(
        logCtx,
        `Failed to create notifications for schedule event cancelled: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  /**
   * Handle participant response updates and create notifications for HR/company and other participants
   */
  private async handleParticipantResponseUpdated(
    data: ParticipantResponseUpdatedEvent,
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
        `Handling participant response update: ${data.participant.user?.name || data.participant.userId} ${data.participant.response} for event: ${data.event.title}`,
      );

      // Create notification for the event creator (HR/company)
      const { title: hrTitle, content: hrContent } =
        this.createParticipantResponseNotificationContent(
          data.event,
          data.participant,
          data.previousResponse,
        );

      await this.notificationService.createNotification({
        userId: data.event.createdBy,
        title: hrTitle,
        content: hrContent,
      });

      // Create notifications for all other participants
      for (const otherParticipant of data.participants) {
        // Skip the participant who just updated their response
        if (otherParticipant.userId === data.participant.userId) {
          continue;
        }

        const { title: participantTitle, content: participantContent } =
          this.createOtherParticipantResponseNotificationContent(
            data.event,
            data.participant,
            otherParticipant,
            data.previousResponse,
          );

        await this.notificationService.createNotification({
          userId: otherParticipant.userId,
          title: participantTitle,
          content: participantContent,
        });
      }

      this.logger.log(
        logCtx,
        `Successfully created notifications for HR and ${data.participants.length - 1} other participants about participant response: ${data.participant.response}`,
      );
    } catch (error) {
      this.logger.error(
        logCtx,
        `Failed to create notification for participant response: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  /**
   * Create notification content for event created
   */
  private createEventCreatedNotificationContent(
    event: ScheduleEventCreatedEvent['event'],
    participant: ScheduleEventCreatedEvent['participants'][0],
  ): { title: string; content: string } {
    const eventType = event.type === 'interview' ? 'Interview' : 'Meeting';
    const role = this.getRoleDisplayName(participant.role);
    const formattedDate = this.formatDateTime(event.startsAt);
    const location = event.location ? ` at ${event.location}` : '';

    return {
      title: `New ${eventType} Scheduled`,
      content: `You have been invited to a ${eventType.toLowerCase()} "${event.title}"${location} on ${formattedDate}. Your role: ${role}.${event.notes ? `\n\nNotes: ${event.notes}` : ''}`,
    };
  }

  /**
   * Create notification content for event updated
   */
  private createEventUpdatedNotificationContent(
    event: ScheduleEventUpdatedEvent['event'],
    previousEvent: ScheduleEventUpdatedEvent['previousEvent'],
    participant: ScheduleEventUpdatedEvent['participants'][0],
  ): { title: string; content: string } {
    const eventType = event.type === 'interview' ? 'Interview' : 'Meeting';
    const role = this.getRoleDisplayName(participant.role);
    const formattedDate = this.formatDateTime(event.startsAt);
    const location = event.location ? ` at ${event.location}` : '';

    const changes = this.getEventChanges(event, previousEvent);
    const changesText =
      changes.length > 0 ? `\n\nChanges: ${changes.join(', ')}` : '';

    return {
      title: `${eventType} Updated`,
      content: `The ${eventType.toLowerCase()} "${event.title}"${location} on ${formattedDate} has been updated. Your role: ${role}.${changesText}${event.notes ? `\n\nNotes: ${event.notes}` : ''}`,
    };
  }

  /**
   * Create notification content for event cancelled
   */
  private createEventCancelledNotificationContent(
    event: ScheduleEventCancelledEvent['event'],
    participant: ScheduleEventCancelledEvent['participants'][0],
  ): { title: string; content: string } {
    const eventType = event.type === 'interview' ? 'Interview' : 'Meeting';
    const role = this.getRoleDisplayName(participant.role);
    const formattedDate = this.formatDateTime(event.startsAt);
    const location = event.location ? ` at ${event.location}` : '';

    return {
      title: `${eventType} Cancelled`,
      content: `The ${eventType.toLowerCase()} "${event.title}"${location} on ${formattedDate} has been cancelled. Your role was: ${role}.`,
    };
  }

  /**
   * Create notification content for participant response updates (for HR)
   */
  private createParticipantResponseNotificationContent(
    event: ParticipantResponseUpdatedEvent['event'],
    participant: ParticipantResponseUpdatedEvent['participant'],
    previousResponse: string,
  ): { title: string; content: string } {
    const eventType = event.type === 'interview' ? 'Interview' : 'Meeting';
    const participantName =
      participant.user?.name || `User ${participant.userId}`;
    const roleDisplay = this.getRoleDisplayName(participant.role);

    let title: string;
    let content: string;

    if (participant.response === 'confirmed') {
      title = `✅ ${participantName} Confirmed Attendance`;
      content = `${participantName} (${roleDisplay}) has confirmed their attendance for the ${eventType.toLowerCase()} "${event.title}" on ${this.formatDateTime(event.startsAt)}.`;
    } else if (participant.response === 'declined') {
      title = `❌ ${participantName} Declined Attendance`;
      content = `${participantName} (${roleDisplay}) has declined the ${eventType.toLowerCase()} "${event.title}" scheduled for ${this.formatDateTime(event.startsAt)}.`;
    } else {
      title = `🔄 ${participantName} Updated Response`;
      content = `${participantName} (${roleDisplay}) has updated their response from "${previousResponse}" to "${participant.response}" for the ${eventType.toLowerCase()} "${event.title}" on ${this.formatDateTime(event.startsAt)}.`;
    }

    return { title, content };
  }

  /**
   * Create notification content for other participants when someone updates their response
   */
  private createOtherParticipantResponseNotificationContent(
    event: ParticipantResponseUpdatedEvent['event'],
    updatedParticipant: ParticipantResponseUpdatedEvent['participant'],
    otherParticipant: ParticipantResponseUpdatedEvent['participants'][0],
    previousResponse: string,
  ): { title: string; content: string } {
    const eventType = event.type === 'interview' ? 'Interview' : 'Meeting';
    const updatedParticipantName =
      updatedParticipant.user?.name || `User ${updatedParticipant.userId}`;
    const updatedParticipantRole = this.getRoleDisplayName(
      updatedParticipant.role,
    );
    const otherParticipantRole = this.getRoleDisplayName(otherParticipant.role);

    let title: string;
    let content: string;

    if (updatedParticipant.response === 'confirmed') {
      title = `👥 ${updatedParticipantName} Confirmed for ${eventType}`;
      content = `${updatedParticipantName} (${updatedParticipantRole}) has confirmed their attendance for the ${eventType.toLowerCase()} "${event.title}" on ${this.formatDateTime(event.startsAt)}. Your role: ${otherParticipantRole}.`;
    } else if (updatedParticipant.response === 'declined') {
      title = `👥 ${updatedParticipantName} Declined ${eventType}`;
      content = `${updatedParticipantName} (${updatedParticipantRole}) has declined the ${eventType.toLowerCase()} "${event.title}" scheduled for ${this.formatDateTime(event.startsAt)}. Your role: ${otherParticipantRole}.`;
    } else {
      title = `👥 ${updatedParticipantName} Updated Response`;
      content = `${updatedParticipantName} (${updatedParticipantRole}) has updated their response from "${previousResponse}" to "${updatedParticipant.response}" for the ${eventType.toLowerCase()} "${event.title}" on ${this.formatDateTime(event.startsAt)}. Your role: ${otherParticipantRole}.`;
    }

    return { title, content };
  }

  /**
   * Get display name for participant role
   */
  private getRoleDisplayName(role: string): string {
    switch (role) {
      case 'candidate':
        return 'Candidate';
      case 'interviewer':
        return 'Interviewer';
      case 'attendee':
        return 'Attendee';
      case 'host':
        return 'Host';
      default:
        return role.charAt(0).toUpperCase() + role.slice(1);
    }
  }

  /**
   * Format date and time for display
   */
  private formatDateTime(date: Date): string {
    return new Date(date).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Get list of changes between current and previous event
   */
  private getEventChanges(
    event: ScheduleEventUpdatedEvent['event'],
    previousEvent: ScheduleEventUpdatedEvent['previousEvent'],
  ): string[] {
    const changes: string[] = [];

    if (previousEvent.title && event.title !== previousEvent.title) {
      changes.push('title');
    }

    if (
      previousEvent.startsAt &&
      event.startsAt.getTime() !== previousEvent.startsAt.getTime()
    ) {
      changes.push('time');
    }

    if (previousEvent.location && event.location !== previousEvent.location) {
      changes.push('location');
    }

    if (previousEvent.notes && event.notes !== previousEvent.notes) {
      changes.push('notes');
    }

    return changes;
  }
}
