import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Category } from '@/modules/category/entities/category.entity';
import { Company } from '@/modules/company/entities/company.entity';
import { Skill } from '@/modules/skill/entities/skill.entity';

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
    enum: [
      'FULL_TIME',
      'PART_TIME',
      'CONTRACT',
      'INTERNSHIP',
      'REMOTE',
      'FREELANCE',
      'TEMPORARY',
      'VOLUNTEER',
      'APPRENTICESHIP',
      'CO_OP',
      'SEASONAL',
      'ONSITE',
      'HYBRID',
    ],
    default: 'FULL_TIME',
  })
  typeOfEmployment: string;

  @Column({ name: 'deadline', type: 'timestamp' })
  deadline: Date;

  @Column('text', { array: true })
  benefit: string[];

  @Column({ name: 'vip_expired', type: 'timestamp', nullable: true })
  vipExpired: Date;

  @Column({ name: 'top_job_expired', type: 'timestamp', nullable: true })
  topJobExpired: Date;

  @Column({ name: 'priority_position', type: 'int', default: 3 })
  priorityPosition: number;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @ManyToMany(() => Skill)
  @JoinTable({
    name: 'job_skill',
    joinColumn: {
      name: 'job_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'skill_id',
      referencedColumnName: 'id',
    },
  })
  skills: Skill[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'is_deleted', type: 'boolean', default: false })
  isDeleted: boolean;

  @Column({ name: 'top_job', type: 'int', default: 0 })
  topJob: number;
}
