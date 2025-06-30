import { ApiProperty } from '@nestjs/swagger';

export class PayosBaseResponse {
  @ApiProperty()
  code: number;

  @ApiProperty()
  desc: string;

  @ApiProperty({ required: false })
  data?: any;
}

export class PayosOrder {
  @ApiProperty({ type: 'number', minimum: 1, maximum: 9007199254740991 })
  orderCode: number;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  description: string;

  @ApiProperty()
  cancelUrl: string;

  @ApiProperty()
  returnUrl: string;
}

export class PayosCreateLinkData {
  @ApiProperty()
  checkoutUrl: string;

  @ApiProperty()
  order: PayosOrder;
}

export class PayosCreateLinkResponse extends PayosBaseResponse {
  @ApiProperty()
  declare data: PayosCreateLinkData;
}

export class PayosOrderStatusData {
  @ApiProperty({ type: 'number', minimum: 1, maximum: 9007199254740991 })
  orderCode: number;

  @ApiProperty({ enum: ['PAID', 'PENDING', 'CANCELLED', 'FAILED'] })
  status: 'PAID' | 'PENDING' | 'CANCELLED' | 'FAILED';

  @ApiProperty()
  amount: number;

  @ApiProperty()
  description: string;

  @ApiProperty()
  paymentLinkId: string;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  cancelUrl: string;

  @ApiProperty()
  returnUrl: string;

  @ApiProperty({ required: false })
  paymentMethod?: string;

  @ApiProperty({ required: false })
  paymentTime?: string;
}

export class PayosOrderStatusResponse extends PayosBaseResponse {
  @ApiProperty()
  declare data: PayosOrderStatusData;
}

export class PayosWebhookPayload {
  @ApiProperty({ type: 'number', minimum: 1, maximum: 9007199254740991 })
  orderCode: number;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  description: string;

  @ApiProperty()
  accountNumber: string;

  @ApiProperty()
  reference: string;

  @ApiProperty()
  transactionDateTime: string;

  @ApiProperty()
  paymentLinkId: string;

  @ApiProperty({ enum: ['PAID', 'PENDING', 'CANCELLED', 'FAILED'] })
  status: 'PAID' | 'PENDING' | 'CANCELLED' | 'FAILED';

  @ApiProperty()
  checksum: string;
}
