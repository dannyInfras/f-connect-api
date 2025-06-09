import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
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
import { Certification } from '../interfaces/certification.interface';

export class CvEducation {
  @IsString()
  @IsNotEmpty()
  institution: string;

  @IsString()
  @IsNotEmpty()
  degree: string;

  @IsString()
  @IsNotEmpty()
  field: string;

  @IsString()
  @IsNotEmpty()
  startYear: string;

  @IsString()
  @IsOptional()
  endYear?: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class CvExperience {
  @IsString()
  @IsNotEmpty()
  company: string;

  @IsString()
  @IsNotEmpty()
  role: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  employmentType: string;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsString()
  @IsNotEmpty()
  startDate: string;

  @IsString()
  @IsOptional()
  endDate?: string;
}

@Entity('cv')
export class CV {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  @IsString()
  @IsNotEmpty()
  title: string;

  @Column({ type: 'text', nullable: true })
  @IsString()
  @IsOptional()
  summary: string;

  @Column({ length: 255 })
  @IsString()
  @IsNotEmpty()
  name: string;

  @Column({ type: 'text', nullable: true })
  @IsString()
  @IsOptional()
  image: string;

  @Column({ type: 'text', nullable: true })
  @IsString()
  @IsNotEmpty()
  email: string;

  @Column({ type: 'bigint' })
  @IsNumber()
  @IsNotEmpty()
  phone: number;

  @Column({ type: 'text', nullable: true })
  @IsString()
  @IsOptional()
  linkedin: string;

  @Column({ type: 'text', nullable: true })
  @IsString()
  @IsOptional()
  github: string;

  @Column({ type: 'jsonb', nullable: true, default: [] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CvExperience)
  experience: CvExperience[];

  @Column({ type: 'jsonb', nullable: true, default: [] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CvEducation)
  education: CvEducation[];

  @Column({ type: 'text', nullable: true })
  @IsString()
  @IsOptional()
  skills: string[];

  @Column({ type: 'jsonb', nullable: true, default: [] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Certification)
  certifications: Certification[];

  @Column({ type: 'text', nullable: true })
  @IsString()
  @IsOptional()
  languages: string[];

  @Column({ nullable: true })
  @IsNumber()
  @IsOptional()
  templateId: number;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
