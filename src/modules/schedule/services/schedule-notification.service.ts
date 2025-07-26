import { Injectable } from '@nestjs/common';

import { EventEmitterService } from '@/shared/events/event-emitter.service';
import { AppLogger } from '@/shared/logger/logger.service';
import { MailService } from '@/shared/mail/mail.service';

import { ScheduleEvent } from '../entities/schedule-event.entity';
import { ScheduleParticipant } from '../entities/schedule-participant.entity';
import { ResponseStatus } from '../enums/response-status.enum';

export interface ScheduleEventCreatedEvent {
  event: ScheduleEvent;
  participants: ScheduleParticipant[];
}

export interface ScheduleEventUpdatedEvent {
  event: ScheduleEvent;
  previousEvent: Partial<ScheduleEvent>;
  participants: ScheduleParticipant[];
}

export interface ScheduleEventCancelledEvent {
  event: ScheduleEvent;
  participants: ScheduleParticipant[];
}

export interface ParticipantResponseUpdatedEvent {
  event: ScheduleEvent;
  participant: ScheduleParticipant;
  participants: ScheduleParticipant[];
  previousResponse: ResponseStatus;
}

@Injectable()
export class ScheduleNotificationService {
  constructor(
    private readonly eventEmitter: EventEmitterService,
    private readonly mailService: MailService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(ScheduleNotificationService.name);
  }

  /**
   * Notify participants about a new event
   */
  async notifyEventCreated(event: ScheduleEvent): Promise<void> {
    try {
      // Emit domain event
      this.eventEmitter.emit('schedule.event.created', {
        event,
        participants: event.participants,
      } as ScheduleEventCreatedEvent);

      // Send email notifications to participants
      await this.sendEventInvitationEmails(event);

      this.logger.log(
        { requestID: 'internal', url: 'internal', ip: '0.0.0.0', user: null },
        `Event creation notifications sent for event: ${event.title}`,
      );
    } catch (error) {
      this.logger.error(
        { requestID: 'internal', url: 'internal', ip: '0.0.0.0', user: null },
        `Failed to send event creation notifications: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Notify participants about event updates
   */
  async notifyEventUpdated(
    event: ScheduleEvent,
    previousEvent: Partial<ScheduleEvent>,
  ): Promise<void> {
    try {
      // Emit domain event
      this.eventEmitter.emit('schedule.event.updated', {
        event,
        previousEvent,
        participants: event.participants,
      } as ScheduleEventUpdatedEvent);

      // Send email notifications for significant changes
      if (this.isSignificantChange(event, previousEvent)) {
        await this.sendEventUpdateEmails(event, previousEvent);
      }

      this.logger.log(
        { requestID: 'internal', url: 'internal', ip: '0.0.0.0', user: null },
        `Event update notifications sent for event: ${event.title}`,
      );
    } catch (error) {
      this.logger.error(
        { requestID: 'internal', url: 'internal', ip: '0.0.0.0', user: null },
        `Failed to send event update notifications: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Notify participants about event cancellation
   */
  async notifyEventCancelled(event: ScheduleEvent): Promise<void> {
    try {
      // Emit domain event
      this.eventEmitter.emit('schedule.event.cancelled', {
        event,
        participants: event.participants,
      } as ScheduleEventCancelledEvent);

      // Send cancellation emails
      await this.sendEventCancellationEmails(event);

      this.logger.log(
        { requestID: 'internal', url: 'internal', ip: '0.0.0.0', user: null },
        `Event cancellation notifications sent for event: ${event.title}`,
      );
    } catch (error) {
      this.logger.error(
        { requestID: 'internal', url: 'internal', ip: '0.0.0.0', user: null },
        `Failed to send event cancellation notifications: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Notify about participant response updates
   */
  async notifyParticipantResponse(
    event: ScheduleEvent,
    participant: ScheduleParticipant,
    previousResponse: ResponseStatus,
  ): Promise<void> {
    try {
      // Emit domain event with all participants data
      this.eventEmitter.emit('schedule.participant.response', {
        event,
        participant,
        participants: event.participants,
        previousResponse,
      } as ParticipantResponseUpdatedEvent);

      // Notify event creator and other relevant participants
      await this.sendParticipantResponseEmails(event, participant);

      this.logger.log(
        { requestID: 'internal', url: 'internal', ip: '0.0.0.0', user: null },
        `Participant response notifications sent for ${participant.response}`,
      );
    } catch (error) {
      this.logger.error(
        { requestID: 'internal', url: 'internal', ip: '0.0.0.0', user: null },
        `Failed to send participant response notifications: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Schedule reminder notifications
   */
  async scheduleReminders(event: ScheduleEvent): Promise<void> {
    try {
      const reminderTimes = this.calculateReminderTimes(event.startsAt);

      for (const reminderTime of reminderTimes) {
        this.eventEmitter.emit('schedule.reminder.schedule', {
          eventId: event.id,
          reminderTime,
          participants: event.participants.map((p) => p.userId),
        });
      }

      this.logger.log(
        { requestID: 'internal', url: 'internal', ip: '0.0.0.0', user: null },
        `Scheduled ${reminderTimes.length} reminders for event: ${event.title}`,
      );
    } catch (error) {
      this.logger.error(
        { requestID: 'internal', url: 'internal', ip: '0.0.0.0', user: null },
        `Failed to schedule reminders: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Cancel scheduled reminders
   */
  async cancelReminders(eventId: string): Promise<void> {
    try {
      this.eventEmitter.emit('schedule.reminder.cancel', { eventId });

      this.logger.log(
        { requestID: 'internal', url: 'internal', ip: '0.0.0.0', user: null },
        'Cancelled reminders for event',
      );
    } catch (error) {
      this.logger.error(
        { requestID: 'internal', url: 'internal', ip: '0.0.0.0', user: null },
        `Failed to cancel reminders: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Send event invitation emails
   */
  private async sendEventInvitationEmails(event: ScheduleEvent): Promise<void> {
    const emailPromises = event.participants.map(async (participant) => {
      if (participant.user?.email) {
        return this.mailService.sendMail(
          participant.user.email,
          `Event Invitation: ${event.title}`,
          'schedule-event-invitation',
          {
            participantName: participant.user.name,
            eventTitle: event.title,
            eventType: event.type,
            startTime: event.startsAt,
            endTime: event.endsAt,
            location: event.location,
            notes: event.notes,
            role: participant.role,
          },
        );
      }
    });

    await Promise.allSettled(emailPromises);
  }

  /**
   * Send event update emails
   */
  private async sendEventUpdateEmails(
    event: ScheduleEvent,
    previousEvent: Partial<ScheduleEvent>,
  ): Promise<void> {
    const changes = this.getChangeDescription(event, previousEvent);

    const emailPromises = event.participants.map(async (participant) => {
      if (participant.user?.email) {
        return this.mailService.sendMail(
          participant.user.email,
          `Event Updated: ${event.title}`,
          'schedule-event-update',
          {
            participantName: participant.user.name,
            eventTitle: event.title,
            changes,
            startTime: event.startsAt,
            endTime: event.endsAt,
            location: event.location,
            notes: event.notes,
          },
        );
      }
    });

    await Promise.allSettled(emailPromises);
  }

  /**
   * Send event cancellation emails
   */
  private async sendEventCancellationEmails(
    event: ScheduleEvent,
  ): Promise<void> {
    const emailPromises = event.participants.map(async (participant) => {
      if (participant.user?.email) {
        return this.mailService.sendMail(
          participant.user.email,
          `Event Cancelled: ${event.title}`,
          'schedule-event-cancellation',
          {
            participantName: participant.user.name,
            eventTitle: event.title,
            originalStartTime: event.startsAt,
            originalEndTime: event.endsAt,
            cancellationReason: event.notes,
          },
        );
      }
    });

    await Promise.allSettled(emailPromises);
  }

  /**
   * Send participant response emails
   */
  private async sendParticipantResponseEmails(
    event: ScheduleEvent,
    participant: ScheduleParticipant,
  ): Promise<void> {
    // Notify event creator
    if (event.creator?.email && event.creator.id !== participant.userId) {
      await this.mailService.sendMail(
        event.creator.email,
        `Participant ${participant.response} invitation: ${event.title}`,
        'schedule-participant-response',
        {
          creatorName: event.creator.name,
          participantName: participant.user?.name,
          participantResponse: participant.response,
          eventTitle: event.title,
          startTime: event.startsAt,
        },
      );
    }
  }

  /**
   * Check if the change is significant enough to notify participants
   */
  private isSignificantChange(
    event: ScheduleEvent,
    previousEvent: Partial<ScheduleEvent>,
  ): boolean {
    const significantFields: (keyof ScheduleEvent)[] = [
      'startsAt',
      'endsAt',
      'location',
      'status',
    ];

    return significantFields.some(
      (field) =>
        previousEvent[field] !== undefined &&
        previousEvent[field] !== event[field],
    );
  }

  /**
   * Get description of changes between versions
   */
  private getChangeDescription(
    event: ScheduleEvent,
    previousEvent: Partial<ScheduleEvent>,
  ): string[] {
    const changes: string[] = [];

    if (previousEvent.startsAt !== event.startsAt) {
      changes.push(`Start time changed to ${event.startsAt}`);
    }

    if (previousEvent.endsAt !== event.endsAt) {
      changes.push(`End time changed to ${event.endsAt}`);
    }

    if (previousEvent.location !== event.location) {
      changes.push(`Location changed to ${event.location || 'Not specified'}`);
    }

    if (previousEvent.status !== event.status) {
      changes.push(`Status changed to ${event.status}`);
    }

    return changes;
  }

  /**
   * Calculate reminder times (24 hours, 2 hours, 15 minutes before)
   */
  private calculateReminderTimes(eventStart: Date): Date[] {
    const reminders: Date[] = [];
    const startTime = new Date(eventStart);

    // 24 hours before
    const oneDayBefore = new Date(startTime.getTime() - 24 * 60 * 60 * 1000);
    if (oneDayBefore > new Date()) {
      reminders.push(oneDayBefore);
    }

    // 2 hours before
    const twoHoursBefore = new Date(startTime.getTime() - 2 * 60 * 60 * 1000);
    if (twoHoursBefore > new Date()) {
      reminders.push(twoHoursBefore);
    }

    // 15 minutes before
    const fifteenMinBefore = new Date(startTime.getTime() - 15 * 60 * 1000);
    if (fifteenMinBefore > new Date()) {
      reminders.push(fifteenMinBefore);
    }

    return reminders;
  }
}
