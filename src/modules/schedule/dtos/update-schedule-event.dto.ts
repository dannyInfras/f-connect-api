import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

import {
  SCHEDULE_CONTENT_LIMITS,
  SCHEDULE_ERROR_MESSAGES,
} from '../constants/schedule.constants';
import { EventStatus } from '../enums/event-status.enum';
import { EventType } from '../enums/event-type.enum';

export class UpdateScheduleEventDto {
  @ApiPropertyOptional({
    description: 'Event title',
    maxLength: SCHEDULE_CONTENT_LIMITS.MAX_TITLE_LENGTH,
    example: 'Technical Interview - Frontend Developer (Updated)',
  })
  @IsOptional()
  @IsString({ message: 'Event title must be a string' })
  @MaxLength(SCHEDULE_CONTENT_LIMITS.MAX_TITLE_LENGTH, {
    message: SCHEDULE_ERROR_MESSAGES.CONTENT.TITLE_TOO_LONG,
  })
  title?: string;

  @ApiPropertyOptional({
    description: 'Type of event',
    enum: EventType,
    example: EventType.MEETING,
  })
  @IsOptional()
  @IsEnum(EventType, {
    message: 'Event type must be either "interview" or "meeting"',
  })
  type?: EventType;

  @ApiPropertyOptional({
    description: 'Event status',
    enum: EventStatus,
    example: EventStatus.CONFIRMED,
  })
  @IsOptional()
  @IsEnum(EventStatus, {
    message: 'Event status must be one of: pending, confirmed, cancelled',
  })
  status?: EventStatus;

  @ApiPropertyOptional({
    description: 'Event start time (ISO 8601)',
    example: '2025-02-15T14:00:00Z',
  })
  @IsOptional()
  @IsDateString(
    {},
    { message: 'Start time must be a valid ISO 8601 date string' },
  )
  startsAt?: string;

  @ApiPropertyOptional({
    description: 'Event end time (ISO 8601)',
    example: '2025-02-15T15:00:00Z',
  })
  @IsOptional()
  @IsDateString(
    {},
    { message: 'End time must be a valid ISO 8601 date string' },
  )
  endsAt?: string;

  @ApiPropertyOptional({
    description: 'Event location',
    maxLength: SCHEDULE_CONTENT_LIMITS.MAX_LOCATION_LENGTH,
    example: 'Conference Room B / Zoom Meeting',
  })
  @IsOptional()
  @IsString({ message: 'Location must be a string' })
  @MaxLength(SCHEDULE_CONTENT_LIMITS.MAX_LOCATION_LENGTH, {
    message: SCHEDULE_ERROR_MESSAGES.CONTENT.LOCATION_TOO_LONG,
  })
  location?: string;

  @ApiPropertyOptional({
    description: 'Event notes and additional information',
    maxLength: SCHEDULE_CONTENT_LIMITS.MAX_NOTES_LENGTH,
    example: 'Updated requirements: Please bring updated portfolio.',
  })
  @IsOptional()
  @IsString({ message: 'Notes must be a string' })
  @MaxLength(SCHEDULE_CONTENT_LIMITS.MAX_NOTES_LENGTH, {
    message: SCHEDULE_ERROR_MESSAGES.CONTENT.NOTES_TOO_LONG,
  })
  notes?: string;

  @ApiPropertyOptional({
    description: 'Version for optimistic locking (required for updates)',
    minimum: 1,
    example: 1,
  })
  @IsOptional()
  @IsInt({ message: 'Version must be an integer' })
  @Min(1, { message: 'Version must be at least 1' })
  version?: number;
}
