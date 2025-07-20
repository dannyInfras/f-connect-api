import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { CV } from '../../cv/entities/cv.entity';
import { User } from '../../user/entities/user.entity';

@Entity('roadmaps')
export class Roadmap {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ nullable: true })
  cvName: string;

  @Column()
  jobTitle: string;

  @Column({ default: 0 })
  progress: number;

  @Column({ type: 'jsonb', nullable: true })
  skills: RoadmapSkill[];

  @Column()
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  cvId: string;

  @ManyToOne(() => CV, { nullable: true })
  @JoinColumn({ name: 'cvId' })
  cv: CV;

  @Column({ nullable: true })
  jobId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

export interface RoadmapSkill {
  id: string;
  title: string;
  description: string;
  progress: number;
  tasks: RoadmapTask[];
  test?: RoadmapTest;
}

export interface RoadmapTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface RoadmapTest {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  score?: number;
  questions: RoadmapQuestion[];
}

export interface RoadmapQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  userAnswer?: number;
} 