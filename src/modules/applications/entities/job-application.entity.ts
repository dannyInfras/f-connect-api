import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Job } from '@/modules/jobs/entities/jobs.entity';
import { User } from '@/modules/user/entities/user.entity';

import { ApplicationStatus } from '../enums/application-status.enum';

@Entity()
export class JobApplication {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Job)
  @JoinColumn({ name: 'job_id' })
  job: Job;

  @Column({ nullable: true })
  cv_id: string;

  @Column({ nullable: true })
  cover_letter: string;

  @Column({
    type: 'enum',
    enum: ApplicationStatus,
    default: ApplicationStatus.APPLIED,
  })
  status: ApplicationStatus;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  applied_at: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updated_at: Date;
}
