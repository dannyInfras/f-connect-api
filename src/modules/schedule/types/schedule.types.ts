import { User } from '@/modules/user/entities/user.entity';

import { EventStatus } from '../enums/event-status.enum';
import { EventType } from '../enums/event-type.enum';
import { ParticipantRole } from '../enums/participant-role.enum';
import { ResponseStatus } from '../enums/response-status.enum';

export interface TimeRange {
  startsAt: Date;
  endsAt: Date;
}

export interface CreateEventData {
  companyId: string;
  createdBy: number;
  title: string;
  type: EventType;
  startsAt: Date;
  endsAt: Date;
  location?: string;
  notes?: string;
  applicationId?: number;
  participants: CreateParticipantData[];
}

export interface CreateParticipantData {
  userId: number;
  role: ParticipantRole;
}

export interface UpdateEventData {
  title?: string;
  type?: EventType;
  status?: EventStatus;
  startsAt?: Date;
  endsAt?: Date;
  location?: string;
  notes?: string;
  version: number;
}

export interface EventFilter {
  companyId?: string;
  userId?: number;
  applicationId?: number;
  type?: EventType;
  status?: EventStatus;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IScheduleService {
  createEvent(data: CreateEventData, creator: User): Promise<any>;
  updateEvent(id: string, data: UpdateEventData, actor: User): Promise<any>;
  cancelEvent(id: string, actor: User): Promise<void>;
  rescheduleEvent(
    id: string,
    newTimeRange: TimeRange,
    actor: User,
  ): Promise<any>;
  confirmAttendance(eventId: string, user: User): Promise<void>;
  declineAttendance(eventId: string, user: User): Promise<void>;
  fetchEvents(filter: EventFilter, user: User): Promise<PaginatedResult<any>>;
  getEventById(id: string, user: User): Promise<any>;
  getEventsByApplication(
    applicationId: number,
    user: User,
    type?: EventType,
  ): Promise<any[]>;
}

export interface IScheduleRepository {
  create(event: CreateEventData): Promise<any>;
  update(id: string, data: UpdateEventData): Promise<any>;
  findById(id: string): Promise<any | null>;
  findByFilter(filter: EventFilter): Promise<PaginatedResult<any>>;
  checkTimeConflicts(
    participants: string[],
    timeRange: TimeRange,
  ): Promise<boolean>;
  softDelete(id: string): Promise<void>;
  findEventsByParticipant(
    userId: number,
    timeRange?: TimeRange,
  ): Promise<any[]>;
}

export interface ParticipantUpdate {
  eventId: string;
  userId: number;
  response: ResponseStatus;
}
