import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Matches,Min } from 'class-validator';

export class CreatePaymentLinkDto {
  @ApiProperty({
    description:
      'Unique order code for the payment (must be a positive number)',
    type: 'number',
    minimum: 1,
    maximum: 9007199254740991, // JavaScript's MAX_SAFE_INTEGER
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  orderCode: number;

  @ApiProperty({
    description: 'Payment amount in VND (minimum 1000)',
    minimum: 1000,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1000)
  amount: number;

  @ApiProperty({ description: 'Description of the payment' })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ description: 'URL to redirect after successful payment' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^https?:\/\/(localhost(:\d+)?|[\w-]+\.[\w-]+).*$/, {
    message: 'returnUrl must be a valid URL (supports localhost)',
  })
  returnUrl: string;

  @ApiProperty({ description: 'URL to redirect when payment is cancelled' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^https?:\/\/(localhost(:\d+)?|[\w-]+\.[\w-]+).*$/, {
    message: 'cancelUrl must be a valid URL (supports localhost)',
  })
  cancelUrl: string;
}
