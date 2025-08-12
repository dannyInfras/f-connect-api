import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Quiz } from './quiz.entity';

export interface UserAnswer {
  questionId: string;
  questionText: string;
  questionType: string;
  questionDifficulty: string;
  questionTopic: string;
  selectedAnswers: string[];
  selectedAnswerTexts: string[];
  correctAnswers: string[];
  correctAnswerTexts: string[];
  isCorrect: boolean;
  points: number;
  earnedPoints: number;
  timeSpent?: number;
  answeredAt?: Date;
}

export interface QuizFeedback {
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  topicScores: Record<
    string,
    { correct: number; total: number; percentage: number }
  >;
}

export interface QuizSnapshot {
  quizId: string;
  title: string;
  totalQuestions: number;
  passingScore: number;
  timeLimit: number;
  questions: Array<{
    id: string;
    question: string;
    type: string;
    difficulty: string;
    topic: string;
    points: number;
    answers: Array<{
      id: string;
      text: string;
      isCorrect: boolean;
    }>;
    explanation: string;
  }>;
}

@Entity('quiz_attempts')
export class QuizAttempt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'quiz_id' })
  quizId: string;

  @ManyToOne(() => Quiz, (quiz) => quiz.attempts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'quiz_id' })
  quiz: Quiz;

  @Column({ type: 'int', name: 'user_id' })
  @Index()
  userId: number;

  @Column({ type: 'varchar', name: 'roadmap_id' })
  @Index()
  roadmapId: string;

  @Column({ type: 'jsonb', default: [] })
  answers: UserAnswer[];

  @Column({ type: 'jsonb', nullable: true, name: 'quiz_snapshot' })
  quizSnapshot: QuizSnapshot;

  @Column({ type: 'float', nullable: true })
  score: number;

  @Column({ type: 'float', nullable: true })
  percentage: number;

  @Column({ type: 'boolean', default: false })
  passed: boolean;

  @Column({ type: 'timestamp', name: 'started_at' })
  startedAt: Date;

  @Column({ type: 'timestamp', name: 'completed_at', nullable: true })
  completedAt: Date;

  @Column({ type: 'int', name: 'time_spent', nullable: true })
  timeSpent: number;

  @Column({
    type: 'enum',
    enum: ['in-progress', 'completed', 'abandoned'],
    default: 'in-progress',
  })
  status: 'in-progress' | 'completed' | 'abandoned';

  @Column({ type: 'jsonb', nullable: true })
  feedback: QuizFeedback;

  @Column({ type: 'int', name: 'attempt_number', default: 1 })
  attemptNumber: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
