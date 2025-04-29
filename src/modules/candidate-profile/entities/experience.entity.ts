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
// import { Company } from '../../company/entities/company.entity'; // Uncomment and adjust path if company entity exists

@Entity('experience')
export class Experience {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @ManyToOne(() => CandidateProfile, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'candidate_profile_id' })
  candidateProfile: CandidateProfile;

  // @ManyToOne(() => Company, { nullable: false, onDelete: 'CASCADE' })
  // @JoinColumn({ name: 'company_id' })
  // company: Company;

  @Column({ type: 'varchar', length: 255, nullable: false })
  position: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'date', name: 'start_date', nullable: false })
  startDate: string;

  @Column({ type: 'date', name: 'end_date', nullable: true })
  endDate: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
