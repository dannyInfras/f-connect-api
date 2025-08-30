import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

import { Payment, PaymentStatus } from '../entities/payment.entity';

@Injectable()
export class PaymentRepository extends Repository<Payment> {
  constructor(private dataSource: DataSource) {
    super(Payment, dataSource.createEntityManager());
  }

  async findUserPayments(userId: number, page: number = 1, limit: number = 10) {
    const offset = (page - 1) * limit;

    const [payments, total] = await this.createQueryBuilder('payment')
      .leftJoinAndSelect('payment.coupon', 'coupon')
      .leftJoinAndSelect('payment.user', 'user')
      .where('payment.userId = :userId', { userId })
      .orderBy('payment.createdAt', 'DESC')
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    return {
      data: payments,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findPaymentById(id: number) {
    return this.createQueryBuilder('payment')
      .leftJoinAndSelect('payment.coupon', 'coupon')
      .leftJoinAndSelect('payment.user', 'user')
      .where('payment.id = :id', { id })
      .getOne();
  }

  async findPaymentByTransactionId(transactionId: string) {
    return this.createQueryBuilder('payment')
      .leftJoinAndSelect('payment.coupon', 'coupon')
      .leftJoinAndSelect('payment.user', 'user')
      .where('payment.transactionId = :transactionId', { transactionId })
      .getOne();
  }

  async updatePaymentStatus(
    id: number,
    status: PaymentStatus,
    transactionId?: string,
  ) {
    return this.update(id, { status, transactionId });
  }

  async getPaymentStats(userId: number) {
    const stats = await this.createQueryBuilder('payment')
      .select([
        'COUNT(*) as total',
        'SUM(CASE WHEN payment.status = :success THEN 1 ELSE 0 END) as successful',
        'SUM(CASE WHEN payment.status = :failed THEN 1 ELSE 0 END) as failed',
        'SUM(CASE WHEN payment.status = :success THEN payment.amount ELSE 0 END) as totalAmount',
      ])
      .where('payment.userId = :userId', { userId })
      .setParameters({
        success: PaymentStatus.SUCCESS,
        failed: PaymentStatus.FAILED,
      })
      .getRawOne();

    return {
      total: parseInt(stats.total) || 0,
      successful: parseInt(stats.successful) || 0,
      failed: parseInt(stats.failed) || 0,
      totalAmount: Number(stats.totalamount) || 0, // PostgreSQL returns lowercase
    };
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
    const offset = (page - 1) * limit;
    const queryBuilder = this.createQueryBuilder('payment')
      .leftJoinAndSelect('payment.coupon', 'coupon')
      .leftJoinAndSelect('payment.user', 'user')
      .leftJoinAndSelect('user.company', 'company');

    // Apply filters
    if (search) {
      queryBuilder.andWhere(
        '(payment.user.email ILIKE :search OR payment.transactionId ILIKE :search OR payment.user.name ILIKE :search OR payment.user.company.companyName ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (status) {
      queryBuilder.andWhere('payment.status = :status', { status });
    }

    if (packageType) {
      queryBuilder.andWhere('payment.packageType = :packageType', {
        packageType,
      });
    }

    if (dateRange) {
      const now = new Date();
      let startDate: Date;

      switch (dateRange) {
        case 'today':
          startDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
          );
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(0); // All time
      }

      queryBuilder.andWhere('payment.createdAt >= :startDate', { startDate });
    }

    const [payments, total] = await queryBuilder
      .orderBy('payment.createdAt', 'DESC')
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    return {
      data: payments,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getAllPaymentStats(): Promise<{
    total: number;
    successful: number;
    failed: number;
    totalAmount: number;
    monthlyAmount: number;
    monthlyTransactions: number;
    previousMonthlyAmount: number;
  }> {
    const stats = await this.createQueryBuilder('payment')
      .select([
        'COUNT(*) as total',
        'SUM(CASE WHEN payment.status = :success THEN 1 ELSE 0 END) as successful',
        'SUM(CASE WHEN payment.status = :failed THEN 1 ELSE 0 END) as failed',
        'SUM(CASE WHEN payment.status = :success THEN payment.amount ELSE 0 END) as totalAmount',
      ])
      .setParameters({
        success: PaymentStatus.SUCCESS,
        failed: PaymentStatus.FAILED,
      })
      .getRawOne();

    // Get current month stats
    const currentMonthStats = await this.createQueryBuilder('payment')
      .select([
        'SUM(CASE WHEN payment.status = :success THEN payment.amount ELSE 0 END) as monthlyAmount',
        'COUNT(CASE WHEN payment.status = :success THEN 1 END) as monthlyTransactions',
      ])
      .where(
        'EXTRACT(YEAR FROM payment.created_at) = EXTRACT(YEAR FROM CURRENT_DATE)',
      )
      .andWhere(
        'EXTRACT(MONTH FROM payment.created_at) = EXTRACT(MONTH FROM CURRENT_DATE)',
      )
      .setParameters({
        success: PaymentStatus.SUCCESS,
      })
      .getRawOne();

    // Get previous month stats for growth calculation
    const previousMonthStats = await this.createQueryBuilder('payment')
      .select([
        'SUM(CASE WHEN payment.status = :success THEN payment.amount ELSE 0 END) as previousMonthlyAmount',
      ])
      .where(
        "EXTRACT(YEAR FROM payment.created_at) = EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '1 month')",
      )
      .andWhere(
        "EXTRACT(MONTH FROM payment.created_at) = EXTRACT(MONTH FROM CURRENT_DATE - INTERVAL '1 month')",
      )
      .setParameters({
        success: PaymentStatus.SUCCESS,
      })
      .getRawOne();

    return {
      total: parseInt(stats.total) || 0,
      successful: parseInt(stats.successful) || 0,
      failed: parseInt(stats.failed) || 0,
      totalAmount: Number(stats.totalamount) || 0, // PostgreSQL returns lowercase
      monthlyAmount: Number(currentMonthStats.monthlyamount) || 0,
      monthlyTransactions: parseInt(currentMonthStats.monthlytransactions) || 0,
      previousMonthlyAmount:
        Number(previousMonthStats.previousmonthlyamount) || 0,
    };
  }
}
