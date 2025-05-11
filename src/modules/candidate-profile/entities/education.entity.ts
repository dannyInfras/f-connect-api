import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { CandidateProfile } from './candidate-profile.entity';

@Entity('education')
export class Education {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @ManyToOne(() => CandidateProfile, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'candidate_profile_id' })
  candidateProfile: CandidateProfile;

  @Column({ type: 'varchar', length: 255, nullable: false })
  institution: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  degree: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  field: string;

  @Column({ type: 'integer', nullable: false })
  startYear: number;

  @Column({ type: 'integer', nullable: true })
  endYear: number | null;

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
