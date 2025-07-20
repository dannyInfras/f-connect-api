import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn
  } from 'typeorm';

  import { User } from '../../user/entities/user.entity';
  
  export class ChecklistItem {
    @Column()
    id: string;
  
    @Column()
    text: string;
  
    @Column()
    completed: boolean;
  }
  
  export class RecurringSettings {
    @Column({ nullable: true })
    frequency: 'daily' | 'weekly' | 'monthly' | null;
  
    @Column()
    interval: number;
  }
  
  @Entity('task')
  export class TaskEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({ type: 'varchar', length: 255 })
    title: string;
  
    @Column({ type: 'text', nullable: true })
    description: string;
  
    @Column({ type: 'enum', enum: ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'], default: 'TODO' })
    status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
  
    @Column({ name: 'due_date', type: 'timestamp', nullable: true })
    dueDate: Date;
  
    @Column({ name: 'reminder_time', type: 'timestamp', nullable: true })
    reminderTime: Date;
  
    @Column({ type: 'text', array: true, nullable: true })
    tags: string[];
  
    @Column({ type: 'json', nullable: true })
    checklist: ChecklistItem[];
  
    @Column({ type: 'json', nullable: true })
    recurring: RecurringSettings;
  
    @Column({ name: 'estimated_time', type: 'int', nullable: true })
    estimatedTime: number; // in minutes
  
    @Column({ type: 'enum', enum: ['low', 'medium', 'high'], default: 'medium' })
    priority: 'low' | 'medium' | 'high';
  
    @Column({ type: 'int', nullable: true })
    progress: number;
  
    @Column({ name: 'user_id' })
    userId: number;
  
    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;
  
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
  
    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
  }