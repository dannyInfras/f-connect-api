import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { In } from 'typeorm';

import { UserAccessTokenClaims } from '@/modules/auth/dtos/auth-token-output.dto';
import { User } from '@/modules/user/entities/user.entity';
import { UserRepository } from '@/modules/user/repositories/user.repository';
import { AppLogger } from '@/shared/logger/logger.service';

import {
  SCHEDULE_CONTENT_LIMITS,
  SCHEDULE_ERROR_MESSAGES,
  SCHEDULE_TIME_LIMITS,
} from '../constants/schedule.constants';
import { ScheduleEventResponseDto } from '../dtos/schedule-event-response.dto';
import { ScheduleEvent } from '../entities/schedule-event.entity';
import { EventStatus } from '../enums/event-status.enum';
import { EventType } from '../enums/event-type.enum';
import { ResponseStatus } from '../enums/response-status.enum';
import { ScheduleEventRepository } from '../repositories/schedule-event.repository';
import { ScheduleParticipantRepository } from '../repositories/schedule-participant.repository';
import {
  CreateEventData,
  EventFilter,
  IScheduleService,
  PaginatedResult,
  TimeRange,
  UpdateEventData,
} from '../types/schedule.types';
import { ScheduleAclService } from './schedule-acl.service';
import { ScheduleNotificationService } from './schedule-notification.service';

@Injectable()
export class ScheduleService implements IScheduleService {
  constructor(
    private readonly scheduleRepository: ScheduleEventRepository,
    private readonly participantRepository: ScheduleParticipantRepository,
    private readonly aclService: ScheduleAclService,
    private readonly notificationService: ScheduleNotificationService,
    private readonly userRepository: UserRepository,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(ScheduleService.name);
  }

  async createEvent(
    data: CreateEventData,
    creator: User | UserAccessTokenClaims,
  ): Promise<ScheduleEventResponseDto> {
    // Check permissions
    const actor = this.userToActor(creator);
    if (!this.aclService.canCreateInCompany(actor, data.companyId)) {
      throw new ForbiddenException(
        SCHEDULE_ERROR_MESSAGES.PERMISSIONS.INSUFFICIENT_CREATE,
      );
    }

    // Validate time range
    this.validateTimeRange(new Date(data.startsAt), new Date(data.endsAt));

    // Validate participants
    this.validateParticipants(data.participants);
    // Ensure all participant user IDs exist to avoid FK violation
    const uniqueIds = Array.from(
      new Set(data.participants.map((p) => p.userId)),
    );
    const existingUsers = await this.userRepository.find({
      where: { id: In(uniqueIds) },
    });
    if (existingUsers.length !== uniqueIds.length) {
      throw new BadRequestException(
        'One or more participants are invalid users',
      );
    }

    // Check for time conflicts
    const participantIds = data.participants.map((p) => p.userId.toString());
    const timeRange: TimeRange = {
      startsAt: new Date(data.startsAt),
      endsAt: new Date(data.endsAt),
    };

    const hasConflicts = await this.scheduleRepository.checkTimeConflicts(
      participantIds,
      timeRange,
    );

    if (hasConflicts) {
      throw new ConflictException(
        'One or more participants have conflicting events',
      );
    }

    try {
      // Create the event
      const event = await this.scheduleRepository.create({
        ...data,
        createdBy: creator.id,
      });

      // Send notifications
      await this.notificationService.notifyEventCreated(event);
      await this.notificationService.scheduleReminders(event);

      this.logger.log(
        { requestID: 'internal', url: 'internal', ip: '0.0.0.0', user: null },
        `Event created: ${event.title}`,
      );

      return plainToClass(ScheduleEventResponseDto, event, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      this.logger.error(
        { requestID: 'internal', url: 'internal', ip: '0.0.0.0', user: null },
        `Failed to create event: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  async updateEvent(
    id: string,
    data: UpdateEventData,
    actor: User,
  ): Promise<ScheduleEventResponseDto> {
    const event = await this.getEventWithPermissionCheck(id, actor, 'update');

    // Store previous state for notifications
    const previousEvent = { ...event };

    // Validate time range if both dates are provided
    if (data.startsAt && data.endsAt) {
      this.validateTimeRange(new Date(data.startsAt), new Date(data.endsAt));
    }

    // Check for time conflicts if time is being changed
    if (data.startsAt || data.endsAt) {
      const timeRange: TimeRange = {
        startsAt: data.startsAt ? new Date(data.startsAt) : event.startsAt,
        endsAt: data.endsAt ? new Date(data.endsAt) : event.endsAt,
      };

      const participantIds = event.participants.map((p) => p.userId.toString());
      const hasConflicts = await this.scheduleRepository.checkTimeConflicts(
        participantIds,
        timeRange,
      );

      if (hasConflicts) {
        throw new ConflictException(
          'Time change would create conflicts with participant schedules',
        );
      }
    }

    try {
      const updatedEvent = await this.scheduleRepository.update(id, {
        ...data,
        version: event.version,
      });

      // Send notifications for updates
      await this.notificationService.notifyEventUpdated(
        updatedEvent,
        previousEvent,
      );

      // Reschedule reminders if time changed
      if (data.startsAt || data.endsAt) {
        await this.notificationService.cancelReminders(id);
        await this.notificationService.scheduleReminders(updatedEvent);
      }

      this.logger.log(
        { requestID: 'internal', url: 'internal', ip: '0.0.0.0', user: null },
        `Event updated: ${updatedEvent.title}`,
      );

      return plainToClass(ScheduleEventResponseDto, updatedEvent, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      if ((error as Error).message === 'Event not found or version mismatch') {
        throw new ConflictException(
          'Event was modified by another user. Please refresh and try again.',
        );
      }
      throw error;
    }
  }

  async cancelEvent(id: string, actor: User): Promise<void> {
    const event = await this.getEventWithPermissionCheck(id, actor, 'delete');

    if (event.status === EventStatus.CANCELLED) {
      throw new BadRequestException('Event is already cancelled');
    }

    try {
      const cancelledEvent = await this.scheduleRepository.update(id, {
        status: EventStatus.CANCELLED,
        version: event.version,
      });

      // Send notifications and cancel reminders
      await this.notificationService.notifyEventCancelled(cancelledEvent);
      await this.notificationService.cancelReminders(id);

      this.logger.log(
        { requestID: 'internal', url: 'internal', ip: '0.0.0.0', user: null },
        `Event cancelled: ${event.title}`,
      );
    } catch (error) {
      this.logger.error(
        { requestID: 'internal', url: 'internal', ip: '0.0.0.0', user: null },
        `Failed to cancel event: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  async rescheduleEvent(
    id: string,
    newTimeRange: TimeRange,
    actor: User,
  ): Promise<ScheduleEventResponseDto> {
    const event = await this.getEventWithPermissionCheck(id, actor, 'update');

    this.validateTimeRange(newTimeRange.startsAt, newTimeRange.endsAt);

    // Check for conflicts with new time
    const participantIds = event.participants.map((p) => p.userId.toString());
    const hasConflicts = await this.scheduleRepository.checkTimeConflicts(
      participantIds,
      newTimeRange,
    );

    if (hasConflicts) {
      throw new ConflictException(
        'New time conflicts with participant schedules',
      );
    }

    return this.updateEvent(
      id,
      {
        startsAt: newTimeRange.startsAt,
        endsAt: newTimeRange.endsAt,
        version: event.version,
      },
      actor,
    );
  }

  async confirmAttendance(eventId: string, user: User): Promise<void> {
    await this.updateParticipantResponse(
      eventId,
      user,
      ResponseStatus.ACCEPTED,
    );
  }

  async declineAttendance(eventId: string, user: User): Promise<void> {
    await this.updateParticipantResponse(
      eventId,
      user,
      ResponseStatus.DECLINED,
    );
  }

  async fetchEvents(
    filter: EventFilter,
    user: User,
  ): Promise<PaginatedResult<ScheduleEventResponseDto>> {
    const actor = this.userToActor(user);

    // Apply user-specific filters based on permissions
    const userFilter = this.applyUserFilter(filter, actor);

    const result = await this.scheduleRepository.findByFilter(userFilter);

    // Filter results based on ACL permissions
    const allowedEvents = result.data.filter((event) => {
      return this.aclService.forActor(actor).canDoAction('read', event);
    });

    const responseData = allowedEvents.map((event) =>
      plainToClass(ScheduleEventResponseDto, event, {
        excludeExtraneousValues: true,
      }),
    );

    return {
      ...result,
      data: responseData,
      total: responseData.length,
    };
  }

  async getEventById(
    id: string,
    user: User,
  ): Promise<ScheduleEventResponseDto> {
    const event = await this.getEventWithPermissionCheck(id, user, 'read');

    return plainToClass(ScheduleEventResponseDto, event, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Get all events for a specific application
   */
  async getEventsByApplication(
    applicationId: number,
    user: User,
    type?: EventType,
  ): Promise<ScheduleEventResponseDto[]> {
    const actor = this.userToActor(user);

    // Create filter for the application
    const filter: EventFilter = {
      applicationId,
      type,
      // Get all events without pagination
      page: 1,
      limit: 100, // reasonable limit to avoid performance issues
    };

    // Apply user-specific filters based on permissions
    const userFilter = this.applyUserFilter(filter, actor);

    const result = await this.scheduleRepository.findByFilter(userFilter);

    // Filter results based on ACL permissions
    const allowedEvents = result.data.filter((event) => {
      return this.aclService.forActor(actor).canDoAction('read', event);
    });

    // Convert to response DTOs
    return allowedEvents.map((event) =>
      plainToClass(ScheduleEventResponseDto, event, {
        excludeExtraneousValues: true,
      }),
    );
  }

  /**
   * Get user's upcoming events
   */
  async getUserUpcomingEvents(userId: number): Promise<ScheduleEvent[]> {
    const now = new Date();
    const timeRange: TimeRange = {
      startsAt: now,
      endsAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days
    };

    return this.scheduleRepository.findEventsByParticipant(userId, timeRange);
  }

  /**
   * Check if user has conflicts in a time range
   */
  async checkUserConflicts(
    userId: number,
    timeRange: TimeRange,
  ): Promise<boolean> {
    return this.scheduleRepository.checkTimeConflicts(
      [userId.toString()],
      timeRange,
    );
  }

  /**
   * Update participant response
   */
  private async updateParticipantResponse(
    eventId: string,
    user: User,
    response: ResponseStatus,
  ): Promise<void> {
    const event = await this.scheduleRepository.findById(eventId);
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const actor = this.userToActor(user);
    if (!this.aclService.forActor(actor).canDoAction('update', event)) {
      throw new ForbiddenException(
        SCHEDULE_ERROR_MESSAGES.PERMISSIONS.INSUFFICIENT_UPDATE,
      );
    }

    const participant = await this.participantRepository.findByEventAndUser(
      eventId,
      user.id,
    );

    if (!participant) {
      throw new NotFoundException('You are not a participant in this event');
    }

    const previousResponse = participant.response;
    const updatedParticipant = await this.participantRepository.updateResponse(
      eventId,
      user.id,
      response,
    );

    if (updatedParticipant) {
      await this.notificationService.notifyParticipantResponse(
        event,
        updatedParticipant,
        previousResponse,
      );

      this.logger.log(
        { requestID: 'internal', url: 'internal', ip: '0.0.0.0', user: null },
        `Participant response updated`,
      );
    }
  }

  /**
   * Get event with permission check
   */
  private async getEventWithPermissionCheck(
    id: string,
    user: User,
    action: string,
  ): Promise<ScheduleEvent> {
    const event = await this.scheduleRepository.findById(id);
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const actor = this.userToActor(user);
    if (!this.aclService.forActor(actor).canDoAction(action, event)) {
      const errorMessage =
        action === 'read'
          ? SCHEDULE_ERROR_MESSAGES.PERMISSIONS.INSUFFICIENT_VIEW
          : action === 'update'
            ? SCHEDULE_ERROR_MESSAGES.PERMISSIONS.INSUFFICIENT_UPDATE
            : action === 'delete'
              ? SCHEDULE_ERROR_MESSAGES.PERMISSIONS.INSUFFICIENT_DELETE
              : `Insufficient permissions to ${action} this event`;

      throw new ForbiddenException(errorMessage);
    }

    return event;
  }

  /**
   * Apply user-specific filters based on permissions
   */
  private applyUserFilter(filter: EventFilter, actor: any): EventFilter {
    const userFilter = { ...filter };

    // If user can only view company events, filter by company
    if (
      actor.roles.includes('RECRUITER') ||
      actor.roles.includes('ADMIN_RECRUITER')
    ) {
      if (!userFilter.companyId && actor.company?.id) {
        userFilter.companyId = actor.company.id.toString();
      }
    }

    // If user is a regular user, filter by their participation
    if (actor.roles.includes('USER') && !actor.roles.includes('ADMIN')) {
      userFilter.userId = actor.id;
    }

    return userFilter;
  }

  /**
   * Convert User entity to Actor for ACL
   */
  private userToActor(user: User | UserAccessTokenClaims): any {
    return {
      id: user.id,
      roles: user.roles,
      company:
        'company' in user && user.company
          ? user.company
          : 'companyId' in user && user.companyId
            ? { id: user.companyId }
            : undefined,
    };
  }

  /**
   * Validate participants list
   */
  private validateParticipants(
    participants: Array<{ userId: number; role: string }>,
  ): void {
    // Check participant count limits
    if (
      participants.length < SCHEDULE_CONTENT_LIMITS.MIN_PARTICIPANTS_REQUIRED
    ) {
      throw new BadRequestException(
        SCHEDULE_ERROR_MESSAGES.PARTICIPANTS.TOO_FEW,
      );
    }

    if (
      participants.length > SCHEDULE_CONTENT_LIMITS.MAX_PARTICIPANTS_PER_EVENT
    ) {
      throw new BadRequestException(
        SCHEDULE_ERROR_MESSAGES.PARTICIPANTS.TOO_MANY,
      );
    }

    // Check for duplicate participants
    const userIds = participants.map((p) => p.userId);
    const uniqueUserIds = new Set(userIds);
    if (userIds.length !== uniqueUserIds.size) {
      throw new BadRequestException(
        SCHEDULE_ERROR_MESSAGES.PARTICIPANTS.DUPLICATE_USER,
      );
    }
  }

  /**
   * Validate time range with comprehensive business rules
   */
  private validateTimeRange(startsAt: Date, endsAt: Date): void {
    const now = new Date();

    // Basic time order validation
    if (startsAt >= endsAt) {
      throw new BadRequestException(
        SCHEDULE_ERROR_MESSAGES.TIME_VALIDATION.END_BEFORE_START,
      );
    }

    // Past time validation
    if (startsAt < now) {
      throw new BadRequestException(
        SCHEDULE_ERROR_MESSAGES.TIME_VALIDATION.START_IN_PAST,
      );
    }

    // Duration validation
    const duration = endsAt.getTime() - startsAt.getTime();
    if (duration > SCHEDULE_TIME_LIMITS.MAX_EVENT_DURATION) {
      throw new BadRequestException(
        SCHEDULE_ERROR_MESSAGES.TIME_VALIDATION.DURATION_TOO_LONG,
      );
    }

    // Minimum advance notice validation
    const advanceNotice = startsAt.getTime() - now.getTime();
    if (advanceNotice < SCHEDULE_TIME_LIMITS.MIN_ADVANCE_NOTICE) {
      throw new BadRequestException(
        SCHEDULE_ERROR_MESSAGES.TIME_VALIDATION.INSUFFICIENT_ADVANCE_NOTICE,
      );
    }

    // Maximum future scheduling validation
    if (advanceNotice > SCHEDULE_TIME_LIMITS.MAX_FUTURE_SCHEDULING) {
      throw new BadRequestException(
        SCHEDULE_ERROR_MESSAGES.TIME_VALIDATION.TOO_FAR_IN_FUTURE,
      );
    }
  }
}
