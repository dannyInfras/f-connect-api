import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';

export class CreateCouponDto {
  @ApiProperty({ description: 'Coupon code', maxLength: 50 })
  @IsNotEmpty()
  @IsString()
  @Length(1, 50)
  code: string;

  @ApiProperty({
    description: 'Discount percentage (0-100)',
    minimum: 0,
    maximum: 100,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercentage: number;

  @ApiProperty({
    description: 'Valid until date',
    example: '2025-06-28T11:32:58.659Z',
  })
  @IsNotEmpty()
  @IsDateString()
  validUntil: Date;
}
