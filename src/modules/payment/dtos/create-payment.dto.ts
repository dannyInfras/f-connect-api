import { ApiProperty } from '@nestjs/swagger';
import { IsEnum,IsNumber, IsOptional, IsString } from 'class-validator';

import { PackageType } from '../entities/package-types.enum';
import { PaymentMethod, PaymentStatus } from '../entities/payment.entity';

export class CreatePaymentDto {
  @ApiProperty({ description: 'User ID' })
  @IsNumber()
  userId: number;

  @ApiProperty({ description: 'Package type', enum: PackageType })
  @IsEnum(PackageType)
  packageType: PackageType;

  @ApiProperty({ description: 'Coupon ID (optional)' })
  @IsOptional()
  @IsNumber()
  couponId?: number;

  @ApiProperty({ description: 'Payment amount' })
  @IsNumber()
  amount: number;

  @ApiProperty({ description: 'Payment method', enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({ description: 'Payment status', enum: PaymentStatus })
  @IsEnum(PaymentStatus)
  status: PaymentStatus;

  @ApiProperty({ description: 'Transaction ID from payment gateway' })
  @IsOptional()
  @IsString()
  transactionId?: string;
}
