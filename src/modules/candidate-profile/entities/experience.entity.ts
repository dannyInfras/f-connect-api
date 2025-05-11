import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { EmploymentTypeEnum } from '../enums/employee-type';
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

  @Column({ type: 'varchar', name: 'company', nullable: true })
  company: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  role: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    name: 'employment_type',
    nullable: true,
    enum: EmploymentTypeEnum,
  })
  employmentType: string;

  @Column({ type: 'varchar', name: 'location', nullable: true })
  location: string;

  @Column({ type: 'date', name: 'start_date', nullable: false })
  startDate: string;

  @Column({ type: 'date', name: 'end_date', nullable: true })
  endDate: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
