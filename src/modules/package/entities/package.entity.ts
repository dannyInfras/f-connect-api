import { Transform } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('package')
export class Package {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column('text')
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  @Transform(({ value }) => parseFloat(value))
  price: number;

  @Column({ name: 'duration_days' })
  durationDays: number;

  @Column({ length: 20 })
  type: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
