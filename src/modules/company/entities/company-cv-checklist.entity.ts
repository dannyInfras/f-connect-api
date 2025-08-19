import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Company } from './company.entity';

/**
 * CV Screening Checklist Item Interface
 */
export interface ChecklistItem {
  /** Unique identifier for the checklist item */
  id: string;
  /** The checklist criterion description */
  criterion: string;
  /** Weight/importance of this item (1-10) */
  weight: number;
  /** Whether this item is required or optional */
  required: boolean;
  /** Additional notes or context for this criterion */
  description?: string;
}

@Entity('company_cv_checklist')
export class CompanyCvChecklist {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'checklist_name', length: 255 })
  checklistName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'checklist_items', type: 'jsonb' })
  checklistItems: ChecklistItem[];

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'is_default', type: 'boolean', default: false })
  isDefault: boolean;

  @ManyToOne(() => Company, (company) => company.id, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ name: 'company_id', type: 'bigint' })
  companyId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
