import {
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Education } from '@/modules/education/entities/education.entity';
import { Experience } from '@/modules/experience/entities/experience.entity';
import { User } from '@/modules/user/entities/user.entity';

import { ContactDto } from '../dtos/contact.dto';
import { SocialDto } from '../dtos/social.dto';
@Entity('candidate_profile')
export class CandidateProfile {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => Education, (education) => education.candidateProfile)
  educations: Education[];

  @OneToMany(() => Experience, (experience) => experience.candidateProfile)
  experiences: Experience[];

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  title: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  company: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  avatar: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  coverImage: string;

  @Column({ type: 'boolean', default: false })
  isOpenToOpportunities: boolean;

  @Column({ type: 'text', nullable: true })
  about: string;

  @Column({ type: 'jsonb', nullable: true })
  contact: ContactDto;

  @Column({ type: 'jsonb', nullable: true })
  social: SocialDto;

  @Column({ type: 'varchar', length: 50, nullable: true })
  birthDate: string;

  @Column({
    type: 'timestamp',
    name: 'created_at',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @Column({
    type: 'timestamp',
    name: 'updated_at',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;
}
