import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

import {
  SCHEDULE_CONTENT_LIMITS,
  SCHEDULE_ERROR_MESSAGES,
} from '../constants/schedule.constants';
import { EventType } from '../enums/event-type.enum';
import { ParticipantRole } from '../enums/participant-role.enum';

export class CreateParticipantDto {
  @ApiProperty({
    description: 'User ID of the participant',
    example: 123,
  })
  @IsNotEmpty({ message: 'Participant user ID is required' })
  @IsInt({ message: 'Participant user ID must be a valid integer' })
  @IsPositive({ message: 'Participant user ID must be a positive integer' })
  userId: number;

  @ApiProperty({
    description: 'Role of the participant in the event',
    enum: ParticipantRole,
    example: ParticipantRole.CANDIDATE,
  })
  @IsNotEmpty({ message: 'Participant role is required' })
  @IsEnum(ParticipantRole, {
    message:
      'Participant role must be one of: candidate, interviewer, attendee, host',
  })
  role: ParticipantRole;
}

export class CreateScheduleEventDto {
  @ApiProperty({
    description: 'Event title',
    maxLength: SCHEDULE_CONTENT_LIMITS.MAX_TITLE_LENGTH,
    example: 'Technical Interview - Frontend Developer',
  })
  @IsNotEmpty({ message: 'Event title is required' })
  @IsString({ message: 'Event title must be a string' })
  @MaxLength(SCHEDULE_CONTENT_LIMITS.MAX_TITLE_LENGTH, {
    message: SCHEDULE_ERROR_MESSAGES.CONTENT.TITLE_TOO_LONG,
  })
  title: string;

  @ApiProperty({
    description: 'Type of event',
    enum: EventType,
    example: EventType.INTERVIEW,
  })
  @IsNotEmpty({ message: 'Event type is required' })
  @IsEnum(EventType, {
    message: 'Event type must be either "interview" or "meeting"',
  })
  type: EventType;

  @ApiProperty({
    description: 'Event start time (ISO 8601)',
    example: '2025-02-15T10:00:00Z',
  })
  @IsNotEmpty({ message: 'Start time is required' })
  @IsDateString(
    {},
    { message: 'Start time must be a valid ISO 8601 date string' },
  )
  startsAt: string;

  @ApiProperty({
    description: 'Event end time (ISO 8601)',
    example: '2025-02-15T11:00:00Z',
  })
  @IsNotEmpty({ message: 'End time is required' })
  @IsDateString(
    {},
    { message: 'End time must be a valid ISO 8601 date string' },
  )
  endsAt: string;

  @ApiPropertyOptional({
    description: 'Event location',
    maxLength: SCHEDULE_CONTENT_LIMITS.MAX_LOCATION_LENGTH,
    example: 'Conference Room A / Google Meet',
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
    example: 'Please prepare your portfolio and bring identification.',
  })
  @IsOptional()
  @IsString({ message: 'Notes must be a string' })
  @MaxLength(SCHEDULE_CONTENT_LIMITS.MAX_NOTES_LENGTH, {
    message: SCHEDULE_ERROR_MESSAGES.CONTENT.NOTES_TOO_LONG,
  })
  notes?: string;

  @ApiPropertyOptional({
    description: 'Related application ID (link schedule to a job application)',
    example: 18,
  })
  @IsOptional()
  @IsInt({ message: 'Application ID must be a valid integer' })
  applicationId?: number;

  @ApiProperty({
    description: `List of event participants (max ${SCHEDULE_CONTENT_LIMITS.MAX_PARTICIPANTS_PER_EVENT})`,
    type: [CreateParticipantDto],
    minItems: SCHEDULE_CONTENT_LIMITS.MIN_PARTICIPANTS_REQUIRED,
    maxItems: SCHEDULE_CONTENT_LIMITS.MAX_PARTICIPANTS_PER_EVENT,
  })
  @IsArray({ message: 'Participants must be an array' })
  @ArrayNotEmpty({ message: SCHEDULE_ERROR_MESSAGES.PARTICIPANTS.TOO_FEW })
  @ArrayMinSize(SCHEDULE_CONTENT_LIMITS.MIN_PARTICIPANTS_REQUIRED, {
    message: SCHEDULE_ERROR_MESSAGES.PARTICIPANTS.TOO_FEW,
  })
  @ArrayMaxSize(SCHEDULE_CONTENT_LIMITS.MAX_PARTICIPANTS_PER_EVENT, {
    message: SCHEDULE_ERROR_MESSAGES.PARTICIPANTS.TOO_MANY,
  })
  @ArrayUnique((participant) => participant.userId, {
    message: SCHEDULE_ERROR_MESSAGES.PARTICIPANTS.DUPLICATE_USER,
  })
  @ValidateNested({ each: true })
  @Type(() => CreateParticipantDto)
  participants: CreateParticipantDto[];
}
