import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

import { CandidateProfile } from '@/modules/candidate-profile/entities/candidate-profile.entity';
import { Company } from '@/modules/company/entities/company.entity';

@Entity('candidate_bookmark')
@Unique('company_candidate_bookmark_unique', [
  'companyId',
  'candidateProfileId',
])
export class CandidateBookmark {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ name: 'company_id', type: 'bigint' })
  companyId: string;

  @Column({ name: 'candidate_profile_id', type: 'bigint' })
  candidateProfileId: string;

  @ManyToOne(() => Company, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @ManyToOne(() => CandidateProfile, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'candidate_profile_id' })
  candidateProfile: CandidateProfile;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
