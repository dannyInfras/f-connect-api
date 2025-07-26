import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';

export class UpdateCouponDto {
  @ApiPropertyOptional({ description: 'Coupon code', maxLength: 50 })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  code?: string;

  @ApiPropertyOptional({
    description: 'Discount percentage (0-100)',
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercentage?: number;

  @ApiPropertyOptional({
    description: 'Valid until date',
    example: '2025-06-28T11:32:58.659Z',
  })
  @IsOptional()
  @IsDateString()
  validUntil?: Date;

  @ApiPropertyOptional({ description: 'Whether the coupon is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
