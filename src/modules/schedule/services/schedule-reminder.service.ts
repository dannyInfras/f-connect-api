import { Injectable, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { NotificationService } from '@/modules/notification/services/notification.service';
import { EventEmitterService } from '@/shared/events/event-emitter.service';
import { AppLogger } from '@/shared/logger/logger.service';
import { MailService } from '@/shared/mail/mail.service';

import { ScheduleEventRepository } from '../repositories/schedule-event.repository';

interface ReminderEvent {
  eventId: string;
  reminderTime: Date;
  participants: number[];
}

@Injectable()
export class ScheduleReminderService implements OnModuleInit {
  private scheduledReminders = new Map<string, ReminderEvent[]>();

  constructor(
    private readonly eventEmitter: EventEmitterService,
    private readonly scheduleRepository: ScheduleEventRepository,
    private readonly notificationService: NotificationService,
    private readonly mailService: MailService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(ScheduleReminderService.name);
  }

  onModuleInit() {
    // Listen for reminder scheduling events
    this.eventEmitter
      .listen<ReminderEvent>('schedule.reminder.schedule')
      .subscribe({
        next: (data) => this.handleScheduleReminder(data),
        error: (error) => {
          this.logger.error(
            {
              requestID: 'internal',
              url: 'internal',
              ip: '0.0.0.0',
              user: null,
            },
            `Error in schedule reminder listener: ${error.message}`,
          );
        },
      });

    // Listen for reminder cancellation events
    this.eventEmitter
      .listen<{ eventId: string }>('schedule.reminder.cancel')
      .subscribe({
        next: (data) => this.handleCancelReminders(data.eventId),
        error: (error) => {
          this.logger.error(
            {
              requestID: 'internal',
              url: 'internal',
              ip: '0.0.0.0',
              user: null,
            },
            `Error in schedule reminder cancellation listener: ${error.message}`,
          );
        },
      });
  }

  /**
   * Handle scheduling a new reminder
   */
  private handleScheduleReminder(reminderEvent: ReminderEvent): void {
    const { eventId, reminderTime } = reminderEvent;

    if (!this.scheduledReminders.has(eventId)) {
      this.scheduledReminders.set(eventId, []);
    }

    this.scheduledReminders.get(eventId)!.push(reminderEvent);

    this.logger.log(
      {
        requestID: 'internal',
        url: 'internal',
        ip: '0.0.0.0',
        user: null,
      },
      `Scheduled reminder for event ${eventId} at ${reminderTime.toISOString()}`,
    );
  }

  /**
   * Handle cancelling reminders for an event
   */
  private handleCancelReminders(eventId: string): void {
    this.scheduledReminders.delete(eventId);

    this.logger.log(
      {
        requestID: 'internal',
        url: 'internal',
        ip: '0.0.0.0',
        user: null,
      },
      `Cancelled all reminders for event ${eventId}`,
    );
  }

  /**
   * Check for due reminders every minute
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async checkReminders(): Promise<void> {
    const now = new Date();
    const dueReminders: ReminderEvent[] = [];

    // Find all reminders that are due
    for (const [eventId, reminders] of this.scheduledReminders.entries()) {
      const dueForEvent = reminders.filter(
        (reminder) => reminder.reminderTime <= now,
      );

      if (dueForEvent.length > 0) {
        dueReminders.push(...dueForEvent);

        // Remove the due reminders from the scheduled list
        const remainingReminders = reminders.filter(
          (reminder) => reminder.reminderTime > now,
        );

        if (remainingReminders.length === 0) {
          this.scheduledReminders.delete(eventId);
        } else {
          this.scheduledReminders.set(eventId, remainingReminders);
        }
      }
    }

    // Process due reminders
    for (const reminder of dueReminders) {
      await this.processReminder(reminder);
    }
  }

  /**
   * Process a single reminder
   */
  private async processReminder(reminder: ReminderEvent): Promise<void> {
    try {
      const event = await this.scheduleRepository.findById(reminder.eventId);
      if (!event) {
        this.logger.warn(
          {
            requestID: 'internal',
            url: 'internal',
            ip: '0.0.0.0',
            user: null,
          },
          `Event ${reminder.eventId} not found for reminder`,
        );
        return;
      }

      // Calculate time until event
      const timeUntilEvent = event.startsAt.getTime() - Date.now();
      const minutesUntilEvent = Math.floor(timeUntilEvent / (1000 * 60));
      const hoursUntilEvent = Math.floor(minutesUntilEvent / 60);
      const daysUntilEvent = Math.floor(hoursUntilEvent / 24);

      let timeDescription: string;
      if (daysUntilEvent > 0) {
        timeDescription = `${daysUntilEvent} day${daysUntilEvent > 1 ? 's' : ''}`;
      } else if (hoursUntilEvent > 0) {
        timeDescription = `${hoursUntilEvent} hour${hoursUntilEvent > 1 ? 's' : ''}`;
      } else {
        timeDescription = `${minutesUntilEvent} minute${minutesUntilEvent > 1 ? 's' : ''}`;
      }

      // Create notifications for all participants
      for (const participant of event.participants) {
        const title = `Reminder: ${event.title} in ${timeDescription}`;
        const content = `Your ${event.type} event "${event.title}" starts in ${timeDescription}. Location: ${event.location || 'TBD'}`;

        // Create in-app notification
        await this.notificationService.createNotification({
          userId: participant.userId,
          title,
          content,
        });

        // Send email reminder if user has email
        if (participant.user?.email) {
          await this.mailService.sendMail(
            participant.user.email,
            title,
            'schedule-event-reminder',
            {
              participantName: participant.user.name,
              eventTitle: event.title,
              eventType: event.type,
              timeUntilEvent: timeDescription,
              startTime: event.startsAt,
              endTime: event.endsAt,
              location: event.location,
              notes: event.notes,
              role: participant.role,
            },
          );
        }
      }

      this.logger.log(
        {
          requestID: 'internal',
          url: 'internal',
          ip: '0.0.0.0',
          user: null,
        },
        `Processed reminder for event ${event.title} - ${timeDescription} until start`,
      );
    } catch (error) {
      this.logger.error(
        {
          requestID: 'internal',
          url: 'internal',
          ip: '0.0.0.0',
          user: null,
        },
        `Failed to process reminder for event ${reminder.eventId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
