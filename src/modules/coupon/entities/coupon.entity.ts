import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('coupon')
export class Coupon {
  @ApiProperty()
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 50 })
  code: string;

  @ApiProperty()
  @Column({
    type: 'numeric',
    precision: 5,
    scale: 2,
    name: 'discount_percentage',
  })
  discountPercentage: number;

  @ApiProperty()
  @Column({ type: 'date', name: 'valid_until' })
  validUntil: Date;

  @ApiProperty()
  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive: boolean;

  @ApiProperty()
  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;
}
