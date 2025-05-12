import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Job } from '@/modules/jobs/entities/jobs.entity';

@Entity('category')
export class Category {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ unique: true })
  name: string;

  @OneToMany(() => Job, (job) => job.category)
  jobs: Job[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
