import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Coupon } from '../../coupon/entities/coupon.entity';
import { User } from '../../user/entities/user.entity';
import { PackageType } from './package-types.enum';

export enum PaymentMethod {
  VISA = 'VISA',
  MOMO = 'MOMO',
  VNPAY = 'VNPAY',
  PAYOS = 'PAYOS',
}

export enum PaymentStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

@Entity('payment')
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'package_id', nullable: true })
  packageId?: number;

  @Column({ name: 'package_type' })
  packageType: PackageType;

  @Column({ name: 'coupon_id', nullable: true })
  couponId?: number;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({
    name: 'payment_method',
    type: 'enum',
    enum: PaymentMethod,
  })
  paymentMethod: PaymentMethod;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.SUCCESS,
  })
  status: PaymentStatus;

  @Column({ name: 'transaction_id', nullable: true })
  transactionId?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => User, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Coupon, { onDelete: 'NO ACTION', nullable: true })
  @JoinColumn({ name: 'coupon_id' })
  coupon?: Coupon;
}
