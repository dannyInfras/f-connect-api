import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Job } from '@/modules/jobs/entities/jobs.entity';
import { User } from '@/modules/user/entities/user.entity';

export enum ReportStatus {
  PENDING = 'PENDING',
  REVIEWED = 'REVIEWED',
  RESOLVED = 'RESOLVED',
  DISMISSED = 'DISMISSED',
}

@Entity('report')
export class Report {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ length: 255 })
  title: string;

  @Column('text')
  description: string;

  @Column({
    type: 'enum',
    enum: ReportStatus,
    default: ReportStatus.PENDING,
  })
  status: ReportStatus;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id', type: 'integer' })
  userId: number;

  @ManyToOne(() => Job)
  @JoinColumn({ name: 'job_id' })
  job: Job;

  @Column({ name: 'job_id', type: 'bigint' })
  jobId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
