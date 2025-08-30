import { ApiProperty } from '@nestjs/swagger';
import { IsEnum,IsOptional, IsString } from 'class-validator';

import { PaymentMethod, PaymentStatus } from '../entities/payment.entity';

export class GetPaymentHistoryDto {
  @ApiProperty({ description: 'Page number', required: false, default: 1 })
  @IsOptional()
  page?: string = '1';

  @ApiProperty({ description: 'Items per page', required: false, default: 10 })
  @IsOptional()
  limit?: string = '10';

  @ApiProperty({
    description: 'Filter by payment method',
    required: false,
    enum: PaymentMethod,
  })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiProperty({
    description: 'Filter by payment status',
    required: false,
    enum: PaymentStatus,
  })
  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;
}

export class PaymentHistoryResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  amount: number;

  @ApiProperty({ enum: PaymentMethod })
  paymentMethod: PaymentMethod;

  @ApiProperty({ enum: PaymentStatus })
  status: PaymentStatus;

  @ApiProperty()
  transactionId?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  package: {
    id: number;
    name: string;
    description: string;
    price: number;
    durationDays: number;
    type: string;
  };

  @ApiProperty({ required: false })
  coupon?: {
    id: number;
    code: string;
    discountPercentage: number;
  };
}

export class PaymentStatsResponseDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  successful: number;

  @ApiProperty()
  failed: number;

  @ApiProperty()
  totalAmount: number;
}

export class GetAdminPaymentsDto {
  @ApiProperty({ description: 'Page number', required: false, default: 1 })
  @IsOptional()
  page?: string = '1';

  @ApiProperty({ description: 'Items per page', required: false, default: 10 })
  @IsOptional()
  limit?: string = '10';

  @ApiProperty({ description: 'Search term', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: 'Filter by payment status',
    required: false,
    enum: PaymentStatus,
  })
  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @ApiProperty({
    description: 'Filter by package type',
    required: false,
    enum: ['1', '2', '3', '4', '5'],
  })
  @IsOptional()
  packageType?: string;

  @ApiProperty({
    description: 'Filter by date range',
    required: false,
    enum: ['today', 'week', 'month', 'year'],
  })
  @IsOptional()
  @IsString()
  dateRange?: string;
}

export class AdminPaymentResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  userId: number;

  @ApiProperty()
  packageType: number;

  @ApiProperty({ required: false })
  couponId?: number;

  @ApiProperty()
  amount: number;

  @ApiProperty({ enum: PaymentMethod })
  paymentMethod: PaymentMethod;

  @ApiProperty({ enum: PaymentStatus })
  status: PaymentStatus;

  @ApiProperty({ required: false })
  transactionId?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ required: false })
  user?: {
    id: number;
    email: string;
    fullName?: string;
  };

  @ApiProperty({ required: false })
  company?: {
    id: number;
    name: string;
  };

  @ApiProperty({ required: false })
  coupon?: {
    id: number;
    code: string;
    discountPercentage: number;
  };
}

export class AdminPaymentStatsResponseDto {
  @ApiProperty()
  totalRevenue: number;

  @ApiProperty()
  totalTransactions: number;

  @ApiProperty()
  successRate: number;

  @ApiProperty()
  averageAmount: number;

  @ApiProperty()
  monthlyRevenue: number;

  @ApiProperty()
  monthlyGrowth: number;
}
