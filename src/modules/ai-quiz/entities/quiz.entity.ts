import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

// Forward declaration to avoid circular dependency
import { QuizAttempt } from './quiz-attempt.entity';

export interface QuizQuestion {
  id: string;
  question: string;
  type: 'single-choice' | 'multiple-choice' | 'true-false';
  difficulty: 'easy' | 'medium' | 'hard';
  answers: QuizAnswer[];
  explanation: string;
  topic: string;
  points: number;
  order: number;
}

export interface QuizAnswer {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface QuizMetadata {
  generatedAt: Date;
  model: string;
  roadmapTitle?: string;
  skillsCount?: number;
  industry?: string;
}

@Entity('quizzes')
export class Quiz {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', name: 'roadmap_id' })
  @Index()
  roadmapId: string;

  @Column({ type: 'int', name: 'user_id' })
  @Index()
  userId: number;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb' })
  questions: QuizQuestion[];

  @Column({ type: 'int', name: 'total_questions', default: 50 })
  totalQuestions: number;

  @Column({ type: 'int', name: 'passing_score', default: 70 })
  passingScore: number;

  @Column({ type: 'int', name: 'time_limit', default: 60 })
  timeLimit: number;

  @Column({
    type: 'enum',
    enum: ['draft', 'published', 'archived'],
    default: 'published',
  })
  status: 'draft' | 'published' | 'archived';

  @Column({ type: 'jsonb', nullable: true })
  metadata: QuizMetadata;

  @OneToMany(() => QuizAttempt, (attempt) => attempt.quiz)
  attempts: QuizAttempt[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
