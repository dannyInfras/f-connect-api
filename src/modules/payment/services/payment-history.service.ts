import { Injectable, NotFoundException } from '@nestjs/common';

import { CreatePaymentDto } from '../dtos/create-payment.dto';
import {
  AdminPaymentStatsResponseDto,
  PaymentHistoryResponseDto,
  PaymentStatsResponseDto,
} from '../dtos/payment-history.dto';
import { PACKAGE_INFO } from '../entities/package-types.enum';
import { PaymentMethod, PaymentStatus } from '../entities/payment.entity';
import { PaymentRepository } from '../repositories/payment.repository';

@Injectable()
export class PaymentHistoryService {
  constructor(private readonly paymentRepository: PaymentRepository) {}

  async getUserPaymentHistory(
    userId: number,
    query: {
      page: number;
      limit: number;
      paymentMethod?: PaymentMethod;
      status?: PaymentStatus;
    },
  ): Promise<{ data: PaymentHistoryResponseDto[]; meta: any }> {
    const { page = 1, limit = 10, paymentMethod, status } = query;

    // Get payments with filters
    const result = await this.paymentRepository.findUserPayments(
      userId,
      page,
      limit,
    );

    // Apply additional filters if provided
    let filteredData = result.data;

    if (paymentMethod) {
      filteredData = filteredData.filter(
        (payment) => payment.paymentMethod === paymentMethod,
      );
    }

    if (status) {
      filteredData = filteredData.filter(
        (payment) => payment.status === status,
      );
    }

    // Transform to response DTO
    const transformedData: PaymentHistoryResponseDto[] = filteredData.map(
      (payment) => {
        const packageInfo = PACKAGE_INFO[payment.packageType];
        return {
          id: payment.id,
          amount: payment.amount,
          paymentMethod: payment.paymentMethod,
          status: payment.status,
          transactionId: payment.transactionId,
          createdAt: payment.createdAt,
          package: {
            id: payment.packageType,
            name: packageInfo.name,
            description: '', // Remove Vietnamese description
            price: packageInfo.price,
            durationDays: 30, // Default 30 days
            type: packageInfo.name,
          },
          coupon: payment.coupon
            ? {
                id: payment.coupon.id,
                code: payment.coupon.code,
                discountPercentage: payment.coupon.discountPercentage,
              }
            : undefined,
        };
      },
    );

    return {
      data: transformedData,
      meta: result.meta,
    };
  }

  async getPaymentById(
    id: number,
    userId: number,
  ): Promise<PaymentHistoryResponseDto> {
    const payment = await this.paymentRepository.findPaymentById(id);

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Check if user owns this payment
    if (payment.userId !== userId) {
      throw new NotFoundException('Payment not found');
    }

    const packageInfo = PACKAGE_INFO[payment.packageType];
    return {
      id: payment.id,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      status: payment.status,
      transactionId: payment.transactionId,
      createdAt: payment.createdAt,
      package: {
        id: payment.packageType,
        name: packageInfo.name,
        description: '', // Remove Vietnamese description
        price: packageInfo.price,
        durationDays: 30, // Default 30 days
        type: packageInfo.name,
      },
      coupon: payment.coupon
        ? {
            id: payment.coupon.id,
            code: payment.coupon.code,
            discountPercentage: payment.coupon.discountPercentage,
          }
        : undefined,
    };
  }

  async getPaymentStats(userId: number): Promise<PaymentStatsResponseDto> {
    return this.paymentRepository.getPaymentStats(userId);
  }

  async updatePaymentStatus(
    id: number,
    status: PaymentStatus,
    transactionId?: string,
  ): Promise<void> {
    const payment = await this.paymentRepository.findOne({ where: { id } });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    await this.paymentRepository.updatePaymentStatus(id, status, transactionId);
  }

  // Create new payment record
  async createPayment(
    createPaymentDto: CreatePaymentDto,
  ): Promise<PaymentHistoryResponseDto> {
    const payment = this.paymentRepository.create(createPaymentDto);
    const savedPayment = await this.paymentRepository.save(payment);

    return this.getPaymentById(savedPayment.id, savedPayment.userId);
  }

  // Admin methods
  async getAllPayments(
    page: number = 1,
    limit: number = 10,
    search?: string,
    status?: string,
    packageType?: number,
    dateRange?: string,
  ) {
    const result = await this.paymentRepository.getAllPayments(
      page,
      limit,
      search,
      status,
      packageType,
      dateRange,
    );

    // Transform to response DTO
    const transformedData = result.data.map((payment) => {
      return {
        id: payment.id,
        userId: payment.userId,
        packageType: payment.packageType,
        couponId: payment.couponId,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        status: payment.status,
        transactionId: payment.transactionId,
        createdAt: payment.createdAt,
        user: payment.user
          ? {
              id: payment.user.id,
              email: payment.user.email,
              fullName: payment.user.name,
            }
          : undefined,
        company: payment.user?.company
          ? {
              id: parseInt(payment.user.company.id),
              name: payment.user.company.companyName,
            }
          : undefined,
        coupon: payment.coupon
          ? {
              id: payment.coupon.id,
              code: payment.coupon.code,
              discountPercentage: payment.coupon.discountPercentage,
            }
          : undefined,
      };
    });

    return {
      data: transformedData,
      total: result.meta.total,
      page: result.meta.page,
      limit: result.meta.limit,
      totalPages: result.meta.totalPages,
    };
  }

  async getAllPaymentStats(): Promise<AdminPaymentStatsResponseDto> {
    const stats = await this.paymentRepository.getAllPaymentStats();

    console.log('Stats from repository:', stats); // Debug log

    // Calculate additional stats for admin
    const totalRevenue = stats.totalAmount;
    const totalTransactions = stats.total;
    const successRate =
      stats.total > 0 ? (stats.successful / stats.total) * 100 : 0;
    const averageAmount = stats.total > 0 ? stats.totalAmount / stats.total : 0;

    console.log('Calculated values:', {
      // Debug log
      totalRevenue,
      totalTransactions,
      successRate,
      averageAmount,
      monthlyRevenue: stats.monthlyAmount,
      previousMonthlyAmount: stats.previousMonthlyAmount,
      rawMonthlyGrowth:
        stats.previousMonthlyAmount > 0
          ? ((stats.monthlyAmount - stats.previousMonthlyAmount) /
              stats.previousMonthlyAmount) *
            100
          : 0,
      cappedMonthlyGrowth: Math.min(
        stats.previousMonthlyAmount > 0
          ? ((stats.monthlyAmount - stats.previousMonthlyAmount) /
              stats.previousMonthlyAmount) *
              100
          : 0,
        1000,
      ),
    });

    // Calculate monthly stats
    const monthlyRevenue = stats.monthlyAmount;
    const rawMonthlyGrowth =
      stats.previousMonthlyAmount > 0
        ? ((stats.monthlyAmount - stats.previousMonthlyAmount) /
            stats.previousMonthlyAmount) *
          100
        : 0;

    // Cap monthly growth at 1000% to avoid unrealistic values
    const monthlyGrowth = Math.min(rawMonthlyGrowth, 1000);

    return {
      totalRevenue,
      totalTransactions,
      successRate: Math.round(successRate * 100) / 100, // Round to 2 decimal places
      averageAmount: Math.round(averageAmount * 100) / 100,
      monthlyRevenue,
      monthlyGrowth: Math.round(monthlyGrowth * 100) / 100, // Round to 2 decimal places
    };
  }
}
