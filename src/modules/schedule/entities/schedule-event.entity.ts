import {
  Check,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';

import { Company } from '@/modules/company/entities/company.entity';
import { User } from '@/modules/user/entities/user.entity';

import { EventStatus } from '../enums/event-status.enum';
import { EventType } from '../enums/event-type.enum';
import { ScheduleParticipant } from './schedule-participant.entity';

@Entity('schedule_events')
@Check('valid_time_range', 'ends_at > starts_at')
export class ScheduleEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id', type: 'uuid' })
  companyId: string;

  @Column({ name: 'created_by', type: 'int' })
  createdBy: number;

  @Column({ length: 120 })
  title: string;

  @Column({
    type: 'enum',
    enum: EventType,
  })
  type: EventType;

  @Column({
    type: 'enum',
    enum: EventStatus,
    default: EventStatus.PENDING,
  })
  status: EventStatus;

  @Column({ name: 'starts_at', type: 'timestamptz' })
  startsAt: Date;

  @Column({ name: 'ends_at', type: 'timestamptz' })
  endsAt: Date;

  @Column({ length: 120, nullable: true })
  location?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ name: 'application_id', type: 'int', nullable: true })
  applicationId?: number;

  @VersionColumn()
  version: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;

  // Relations
  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @OneToMany(() => ScheduleParticipant, (participant) => participant.event, {
    cascade: true,
    eager: true,
  })
  participants: ScheduleParticipant[];
}
