import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Category } from '@/modules/category/entities/category.entity';
import { Company } from '@/modules/company/entities/company.entity';

@Entity('job')
export class Job {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ length: 255 })
  title: string;

  @Column('text')
  description: string;

  @Column({ length: 255, nullable: true })
  location: string;

  @Column({
    name: 'salary_min',
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
  })
  salaryMin: number;

  @Column({
    name: 'salary_max',
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
  })
  salaryMax: number;

  @Column({ name: 'experience_years', type: 'int', nullable: true })
  experienceYears: number;

  @Column({
    type: 'enum',
    enum: ['OPEN', 'CLOSED'],
    default: 'OPEN',
  })
  status: string;

  @Column({
    type: 'enum',
    enum: ['FullTime', 'PartTime', 'Contract', 'Internship', 'Remote'],
    default: 'FullTime',
  })
  typeOfEmployment: string;

  @Column({ name: 'deadline', type: 'timestamp' })
  deadline: Date;

  @Column('text', { array: true })
  responsibility: string[];

  @Column('text', { array: true })
  jobFitAttributes: string[];

  @Column('text', { array: true })
  niceToHave: string[];

  @Column({ name: 'is_vip', type: 'boolean', default: false })
  isVip: boolean;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
