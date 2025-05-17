// src/modules/company/entities/company.entity.ts
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Job } from '@/modules/jobs/entities/jobs.entity';
import { User } from '@/modules/user/entities/user.entity';

import { Benefit } from './benefit.entity';
import { CoreTeam } from './coreteam.entity';

@Entity('company')
export class Company {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ name: 'company_name', length: 255 })
  companyName: string;

  @Column({ name: 'founded_at', type: 'timestamp', nullable: true })
  foundedAt: Date;

  @Column({ type: 'int', nullable: true })
  phone: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string;

  @Column({ type: 'int', nullable: true })
  employees: number;

  @Column('text', { array: true, nullable: true })
  address: string[];

  @Column({ length: 255, nullable: true })
  website: string;

  @Column({ length: 100, nullable: true })
  industry: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'logo_url', length: 255, nullable: true })
  logoUrl: string;

  @Column('text', { array: true, nullable: true })
  socialMedia: string[];

  @Column('text', { array: true, nullable: true })
  workImageUrl: string[];

  @Column({ name: 'tax_code', length: 255, unique: true })
  taxCode: string;

  @Column({ name: 'business_license_url', length: 255, nullable: true })
  businessLicenseUrl: string;

  @OneToMany(() => Benefit, (benefit) => benefit.company)
  benefits: Benefit[];

  @OneToMany(() => CoreTeam, (coreTeam) => coreTeam.company)
  coreTeam: CoreTeam[];

  @OneToMany(() => Job, (job) => job.company)
  jobs: Job[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => User, (user) => user.company)
  users: User[];
}
