import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { User } from '../../user/entities/user.entity';
import { CV } from './cv.entity';

@Entity('cv_optimization_history')
export class CvOptimizationHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'cv_id' })
  cvId: string;

  @ManyToOne(() => CV, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cv_id' })
  cv: CV;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'job_title', nullable: true })
  jobTitle?: string;

  @Column({ name: 'job_description', type: 'text', nullable: true })
  jobDescription?: string;

  @Column({ name: 'suggestions', type: 'jsonb' })
  suggestions: {
    summary?: {
      suggestion: string;
      reason: string;
    };
    skills?: {
      suggestions: string[];
      reason: string;
    };
    experience?: Array<{
      index: number;
      field: string;
      suggestion: string;
      reason: string;
    }>;
    education?: Array<{
      index: number;
      field: string;
      suggestion: string;
      reason: string;
    }>;
  };

  @Column({ name: 'optimized_cv', type: 'jsonb' })
  optimizedCv: Partial<CV>;

  @Column({ name: 'is_applied', default: false })
  isApplied: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
