import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

import { Skill } from '../../skill/entities/skill.entity';
import { CandidateProfile } from './candidate-profile.entity';

@Entity('candidate_skill')
@Unique(['candidateProfile', 'skill'])
export class CandidateSkill {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @ManyToOne(() => CandidateProfile, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'candidate_profile_id' })
  candidateProfile: CandidateProfile;

  @ManyToOne(() => Skill, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'skill_id' })
  skill: Skill;

  @Column({ type: 'varchar', length: 50, nullable: true })
  proficiencyLevel: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
