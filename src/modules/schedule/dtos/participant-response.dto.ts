import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

import { ParticipantRole } from '../enums/participant-role.enum';
import { ResponseStatus } from '../enums/response-status.enum';

export class ParticipantResponseDto {
  @ApiProperty({ description: 'Event ID' })
  @Expose()
  eventId: string;

  @ApiProperty({ description: 'User ID' })
  @Expose()
  userId: string;

  @ApiProperty({ description: 'Participant role', enum: ParticipantRole })
  @Expose()
  role: ParticipantRole;

  @ApiProperty({ description: 'Response status', enum: ResponseStatus })
  @Expose()
  response: ResponseStatus;

  @ApiProperty({ description: 'User details' })
  @Expose()
  user?: {
    id: string;
    name: string;
    email: string;
  };
}