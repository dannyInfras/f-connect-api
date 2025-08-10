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

@Entity('roadmaps')
export class Roadmap {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column()
  jobTitle: string;

  @Column({ default: 0 })
  progress: number;

  @Column({ nullable: true, default: 12 })
  estimatedDuration: number;

  @Column({ type: 'jsonb', nullable: true })
  skills: RoadmapSkill[];

  // CV Snapshot - Store the actual CV content at the time of roadmap creation
  @Column({ type: 'jsonb', nullable: true })
  cvSnapshot: CVSnapshot;

  // CV Analysis - Store the analysis results
  @Column({ type: 'jsonb', nullable: true })
  cvAnalysis: CVAnalysis;

  @Column()
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  jobId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// CV Snapshot interface - captures CV state at roadmap creation time
export interface CVSnapshot {
  name: string;
  email: string;
  phone: string;
  summary: string;
  experience: Array<{
    company: string;
    role: string;
    description: string;
    startDate: string;
    endDate?: string;
    duration?: string; // Calculated duration
  }>;
  education: Array<{
    institution: string;
    degree: string;
    field: string;
    startYear: string;
    endYear?: string;
  }>;
  skills: string[];
  certifications?: Array<{
    name: string;
    issuer: string;
    date?: string;
  }>;
  languages?: string[];
  totalExperience?: number; // Total years of experience
}

// CV Analysis results
export interface CVAnalysis {
  overallScore: number; // 0-100
  experienceLevel: 'entry' | 'junior' | 'mid' | 'senior' | 'expert';
  strengths: string[];
  weaknesses: string[];
  skillGaps: string[];
  recommendations: string[];
  matchPercentage: number; // How well CV matches the target job
  detailedAnalysis: {
    experience: {
      score: number;
      feedback: string;
    };
    skills: {
      score: number;
      feedback: string;
      matching: string[];
      missing: string[];
    };
    education: {
      score: number;
      feedback: string;
    };
    overall: {
      summary: string;
      nextSteps: string[];
    };
  };
}

export interface RoadmapSkill {
  id: string;
  title: string;
  description: string;
  category: 'fundamental' | 'core' | 'advanced' | 'specialized';
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  estimatedHours: number;
  prerequisites?: string[];
  progress: number;
  tasks: RoadmapTask[];
  order: number; // Skill order in learning path
  reason: string; // Why this skill is important for the candidate
}

export interface RoadmapTask {
  id: string;
  title: string;
  description: string;
  type: 'learn' | 'practice' | 'project' | 'review' | 'assessment';
  estimatedHours: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  completed: boolean;
  order: number; // Task order within skill
  tips?: string[]; // Learning tips without specific resources
  subTasks: RoadmapSubTask[];
  relatedSkills?: string[]; // Skills this task helps develop
}

export interface RoadmapSubTask {
  id: string;
  title: string;
  description?: string; // More detailed description for subtasks
  completed: boolean;
  order: number; // Subtask order
  estimatedMinutes?: number; // More granular time estimate
  checkCriteria?: string; // How to verify completion
}
