import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CreatePaymentLinkDto } from '../dtos/create-payment-link.dto';
import {
  PayosCreateLinkResponse,
  PayosOrderStatusResponse,
  PayosWebhookPayload,
} from '../interfaces/payos-response.interface';
import { PayosService } from '../services/payos.service';

@ApiTags('PayOS')
@Controller('payos')
export class PayosController {
  constructor(private readonly payosService: PayosService) {}

  @Post('create-link')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create a payment link using PayOS' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment link created successfully',
    type: PayosCreateLinkResponse,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async createPaymentLink(
    @Body() createPaymentLinkDto: CreatePaymentLinkDto,
  ): Promise<PayosCreateLinkResponse> {
    return this.payosService.createPaymentLink(createPaymentLinkDto);
  }

  @Get('status/:orderCode')
  @ApiOperation({ summary: 'Get payment status by order code' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment status retrieved successfully',
    type: PayosOrderStatusResponse,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Order not found',
  })
  async getPaymentStatus(
    @Param('orderCode') orderCode: string,
  ): Promise<PayosOrderStatusResponse> {
    return this.payosService.getPaymentStatus(orderCode);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle PayOS webhook notifications' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Webhook processed successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid webhook payload or signature',
  })
  async handleWebhook(@Body() payload: PayosWebhookPayload): Promise<void> {
    this.payosService.handleWebhook(payload);
  }
}
