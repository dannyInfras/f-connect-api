import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

import { User } from '@/modules/user/entities/user.entity';

import { ParticipantRole } from '../enums/participant-role.enum';
import { ResponseStatus } from '../enums/response-status.enum';
import { ScheduleEvent } from './schedule-event.entity';

@Entity('schedule_participants')
export class ScheduleParticipant {
  @PrimaryColumn({ name: 'event_id', type: 'uuid' })
  eventId: string;

  @PrimaryColumn({ name: 'user_id', type: 'int' })
  userId: number;

  @Column({
    type: 'enum',
    enum: ParticipantRole,
  })
  role: ParticipantRole;

  @Column({
    type: 'enum',
    enum: ResponseStatus,
    default: ResponseStatus.PENDING,
  })
  response: ResponseStatus;

  // Relations
  @ManyToOne(() => ScheduleEvent, (event) => event.participants, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'event_id' })
  event: ScheduleEvent;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
