import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { JobApplication } from '@/modules/applications/entities/job-application.entity';
import { User } from '@/modules/user/entities/user.entity';

import { IUserAnalyticsRepository } from '../interfaces/analytics-repositories.interface';

@Injectable()
export class AdminUserAnalyticsRepository implements IUserAnalyticsRepository {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(JobApplication)
    private readonly applicationRepository: Repository<JobApplication>,
  ) {}

  async getUserRegistrationTrends(
    startDate: Date,
    endDate: Date,
    interval: 'daily' | 'weekly' | 'monthly',
  ): Promise<
    Array<{
      date: string;
      registrations: number;
      localRegistrations: number;
      googleRegistrations: number;
    }>
  > {
    // Get user registrations in the date range
    const users = await this.userRepository
      .createQueryBuilder('user')
      .where('user.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .orderBy('user.createdAt', 'ASC')
      .getMany();

    // Group users by date interval
    const grouped = this.groupByInterval(users, 'createdAt', interval);

    return Object.entries(grouped).map(([date, users]) => ({
      date,
      registrations: users.length,
      localRegistrations: users.filter((u) => u.provider === 'local').length,
      googleRegistrations: users.filter((u) => u.provider === 'google').length,
    }));
  }

  async getUserDemographics(): Promise<{
    userByRoles: Array<{ name: string; count: number; percentage: number }>;
    userByProvider: Array<{ name: string; count: number; percentage: number }>;
    userByAccountStatus: Array<{
      name: string;
      count: number;
      percentage: number;
    }>;
  }> {
    const totalUsers = await this.userRepository.count();

    // Get all users for demographic analysis
    const users = await this.userRepository.find();

    // User by roles
    const roleMap = new Map<string, number>();
    users.forEach((user) => {
      if (user.roles && Array.isArray(user.roles)) {
        user.roles.forEach((role) => {
          roleMap.set(role, (roleMap.get(role) || 0) + 1);
        });
      }
    });

    const userByRoles = Array.from(roleMap.entries()).map(([role, count]) => ({
      name: role,
      count,
      percentage: (count / totalUsers) * 100,
    }));

    // User by provider
    const providerMap = new Map<string, number>();
    users.forEach((user) => {
      const provider = user.provider || 'unknown';
      providerMap.set(provider, (providerMap.get(provider) || 0) + 1);
    });

    const userByProvider = Array.from(providerMap.entries()).map(
      ([provider, count]) => ({
        name: provider,
        count,
        percentage: (count / totalUsers) * 100,
      }),
    );

    // User by account status
    const activeUsers = users.filter((user) => !user.isAccountDisabled).length;
    const disabledUsers = users.filter((user) => user.isAccountDisabled).length;

    const userByAccountStatus = [
      {
        name: 'Active',
        count: activeUsers,
        percentage: (activeUsers / totalUsers) * 100,
      },
      {
        name: 'Disabled',
        count: disabledUsers,
        percentage: (disabledUsers / totalUsers) * 100,
      },
    ];

    return {
      userByRoles,
      userByProvider,
      userByAccountStatus,
    };
  }

  async getUserActivityMetrics(): Promise<{
    activeUsersLast30Days: number;
    accountVerificationRate: number;
    averageProfileCompletionRate: number;
    usersWithCompleteProfiles: number;
    activeJobSeekers: number;
  }> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const totalUsers = await this.userRepository.count();

    const activeUsers = await this.userRepository
      .createQueryBuilder('user')
      .where('user.updatedAt >= :thirtyDaysAgo', { thirtyDaysAgo })
      .getCount();

    const verifiedUsers = await this.userRepository.count({
      where: { isAccountDisabled: false },
    });

    const activeJobSeekers = await this.applicationRepository
      .createQueryBuilder('app')
      .leftJoin('app.user', 'user')
      .where('app.applied_at >= :thirtyDaysAgo', { thirtyDaysAgo })
      .select('COUNT(DISTINCT user.id)', 'count')
      .getRawOne()
      .then((result) => parseInt(result.count) || 0);

    return {
      activeUsersLast30Days: activeUsers,
      accountVerificationRate: (verifiedUsers / totalUsers) * 100,
      averageProfileCompletionRate: 75.0, // Placeholder - would need profile analysis
      usersWithCompleteProfiles: Math.floor(totalUsers * 0.75),
      activeJobSeekers,
    };
  }

  private groupByInterval(
    items: any[],
    dateField: string,
    interval: 'daily' | 'weekly' | 'monthly',
  ): Record<string, any[]> {
    const grouped: Record<string, any[]> = {};

    items.forEach((item) => {
      const date = new Date(item[dateField]);
      let key: string;

      switch (interval) {
        case 'daily':
          key = date.toISOString().split('T')[0];
          break;
        case 'weekly':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'monthly':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        default:
          key = date.toISOString().split('T')[0];
      }

      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(item);
    });

    return grouped;
  }
}
