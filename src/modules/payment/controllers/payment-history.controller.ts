import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CreatePaymentDto } from '../dtos/create-payment.dto';
import {
  AdminPaymentStatsResponseDto,
  GetAdminPaymentsDto,
  GetPaymentHistoryDto,
  PaymentHistoryResponseDto,
  PaymentStatsResponseDto,
} from '../dtos/payment-history.dto';
import { PaymentHistoryService } from '../services/payment-history.service';

@ApiTags('Payment History')
@Controller('payment-history')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PaymentHistoryController {
  constructor(private readonly paymentHistoryService: PaymentHistoryService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get user payment history' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment history retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/PaymentHistoryResponseDto' },
        },
        meta: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            page: { type: 'number' },
            limit: { type: 'number' },
            totalPages: { type: 'number' },
          },
        },
      },
    },
  })
  async getUserPaymentHistory(
    @Request() req: ExpressRequest & { user: { id: number } },
    @Query() query: GetPaymentHistoryDto,
  ) {
    const userId = req.user.id;
    // Parse string parameters to numbers
    const parsedQuery = {
      ...query,
      page: query.page ? parseInt(query.page) : 1,
      limit: query.limit ? parseInt(query.limit) : 10,
    };
    return this.paymentHistoryService.getUserPaymentHistory(
      userId,
      parsedQuery,
    );
  }

  @Get('stats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get user payment statistics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment statistics retrieved successfully',
    type: PaymentStatsResponseDto,
  })
  async getPaymentStats(
    @Request() req: ExpressRequest & { user: { id: number } },
  ) {
    const userId = req.user.id;
    return this.paymentHistoryService.getPaymentStats(userId);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get payment details by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment details retrieved successfully',
    type: PaymentHistoryResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Payment not found',
  })
  async getPaymentById(
    @Request() req: ExpressRequest & { user: { id: number } },
    @Param('id') id: string,
  ) {
    const userId = req.user.id;
    return this.paymentHistoryService.getPaymentById(parseInt(id), userId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new payment record' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Payment record created successfully',
    type: PaymentHistoryResponseDto,
  })
  async createPayment(
    @Body() createPaymentDto: CreatePaymentDto,
  ): Promise<PaymentHistoryResponseDto> {
    return this.paymentHistoryService.createPayment(createPaymentDto);
  }

  // Admin endpoints
  @Get('admin/all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all payments (Admin only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'All payments retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/AdminPaymentResponseDto' },
        },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
        totalPages: { type: 'number' },
      },
    },
  })
  async getAllPayments(@Query() query: GetAdminPaymentsDto) {
    return this.paymentHistoryService.getAllPayments(
      parseInt(query.page || '1'),
      parseInt(query.limit || '10'),
      query.search,
      query.status,
      query.packageType ? parseInt(query.packageType) : undefined,
      query.dateRange,
    );
  }

  @Get('admin/stats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all payment statistics (Admin only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment statistics retrieved successfully',
    type: AdminPaymentStatsResponseDto,
  })
  async getAllPaymentStats(): Promise<AdminPaymentStatsResponseDto> {
    return this.paymentHistoryService.getAllPaymentStats();
  }
}
