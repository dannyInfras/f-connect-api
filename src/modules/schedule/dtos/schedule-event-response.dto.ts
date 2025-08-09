import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';

import { EventStatus } from '../enums/event-status.enum';
import { EventType } from '../enums/event-type.enum';
import { ParticipantResponseDto } from './participant-response.dto';

export class ScheduleEventResponseDto {
  @ApiProperty({ description: 'Event ID' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Company ID' })
  @Expose()
  companyId: string;

  @ApiPropertyOptional({ description: 'Company name' })
  @Expose()
  @Transform(({ obj }) => obj?.company?.companyName ?? '')
  companyName?: string;

  @ApiProperty({ description: 'User ID who created the event' })
  @Expose()
  createdBy: string;

  @ApiProperty({ description: 'Event title' })
  @Expose()
  title: string;

  @ApiProperty({ description: 'Type of event', enum: EventType })
  @Expose()
  type: EventType;

  @ApiProperty({ description: 'Event status', enum: EventStatus })
  @Expose()
  status: EventStatus;

  @ApiProperty({ description: 'Event start time' })
  @Expose()
  startsAt: Date;

  @ApiProperty({ description: 'Event end time' })
  @Expose()
  endsAt: Date;

  @ApiPropertyOptional({ description: 'Event location' })
  @Expose()
  location?: string;

  @ApiPropertyOptional({ description: 'Event notes' })
  @Expose()
  notes?: string;

  @ApiPropertyOptional({ description: 'Related application ID if any' })
  @Expose()
  applicationId?: number;

  @ApiProperty({ description: 'Version for optimistic locking' })
  @Expose()
  version: number;

  @ApiProperty({ description: 'Event creation time' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'Event last update time' })
  @Expose()
  updatedAt: Date;

  @ApiProperty({
    description: 'Event participants',
    type: [ParticipantResponseDto],
  })
  @Expose()
  @Type(() => ParticipantResponseDto)
  participants: ParticipantResponseDto[];
}
