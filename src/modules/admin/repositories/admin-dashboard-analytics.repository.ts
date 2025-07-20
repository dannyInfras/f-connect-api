import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { JobApplication } from '@/modules/applications/entities/job-application.entity';
import { ApplicationStatus } from '@/modules/applications/enums/application-status.enum';
import { Company } from '@/modules/company/entities/company.entity';
import { Job } from '@/modules/jobs/entities/jobs.entity';
import { User } from '@/modules/user/entities/user.entity';

import { IDashboardAnalyticsRepository } from '../interfaces/analytics-repositories.interface';

@Injectable()
export class AdminDashboardAnalyticsRepository
  implements IDashboardAnalyticsRepository
{
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
    @InjectRepository(JobApplication)
    private readonly applicationRepository: Repository<JobApplication>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
  ) {}

  async getDashboardMetrics(): Promise<{
    totalUsers: number;
    totalActiveJobs: number;
    totalApplications: number;
    totalCompanies: number;
    userGrowthRate: number;
    jobGrowthRate: number;
    applicationGrowthRate: number;
    companyGrowthRate: number;
  }> {
    const now = new Date();
    const lastMonth = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      now.getDate(),
    );

    // Get current counts
    const [totalUsers, totalActiveJobs, totalApplications, totalCompanies] =
      await Promise.all([
        this.userRepository.count(),
        this.jobRepository.count({ where: { status: 'OPEN' } }),
        this.applicationRepository.count(),
        this.companyRepository.count(),
      ]);

    // Get previous period counts for growth calculation
    const [prevUsers, prevJobs, prevApplications, prevCompanies] =
      await Promise.all([
        this.userRepository
          .createQueryBuilder('user')
          .where('user.createdAt <= :lastMonth', { lastMonth })
          .getCount(),
        this.jobRepository
          .createQueryBuilder('job')
          .where('job.status = :status AND job.createdAt <= :lastMonth', {
            status: 'OPEN',
            lastMonth,
          })
          .getCount(),
        this.applicationRepository
          .createQueryBuilder('app')
          .where('app.applied_at <= :lastMonth', { lastMonth })
          .getCount(),
        this.companyRepository
          .createQueryBuilder('company')
          .where('company.createdAt <= :lastMonth', { lastMonth })
          .getCount(),
      ]);

    return {
      totalUsers,
      totalActiveJobs,
      totalApplications,
      totalCompanies,
      userGrowthRate: this.calculateGrowthRate(totalUsers, prevUsers),
      jobGrowthRate: this.calculateGrowthRate(totalActiveJobs, prevJobs),
      applicationGrowthRate: this.calculateGrowthRate(
        totalApplications,
        prevApplications,
      ),
      companyGrowthRate: this.calculateGrowthRate(
        totalCompanies,
        prevCompanies,
      ),
    };
  }

  async getRecentActivity(): Promise<
    Array<{
      id: string;
      type: string;
      description: string;
      timestamp: Date;
      userId?: number;
      entityId?: string;
    }>
  > {
    // Get recent user registrations
    const recentUsers = await this.userRepository
      .createQueryBuilder('user')
      .orderBy('user.createdAt', 'DESC')
      .limit(5)
      .getMany();

    // Get recent job posts
    const recentJobs = await this.jobRepository
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.company', 'company')
      .orderBy('job.createdAt', 'DESC')
      .limit(5)
      .getMany();

    const activities: Array<{
      id: string;
      type: string;
      description: string;
      timestamp: Date;
      userId?: number;
      entityId?: string;
    }> = [];

    // Add user activities
    recentUsers.forEach((user) => {
      activities.push({
        id: `user-${user.id}`,
        type: 'user_registration',
        description: `New user registered: ${user.email}`,
        timestamp: user.createdAt,
        userId: user.id,
      });
    });

    // Add job activities
    recentJobs.forEach((job) => {
      activities.push({
        id: `job-${job.id}`,
        type: 'job_posted',
        description: `New job posted: ${job.title} by ${job.company?.companyName || 'Unknown Company'}`,
        timestamp: job.createdAt,
        entityId: job.id,
      });
    });

    // Sort by timestamp and return top 10
    return activities
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )
      .slice(0, 10);
  }

  async getSystemAlerts(): Promise<
    Array<{
      id: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      title: string;
      message: string;
      timestamp: Date;
      acknowledged: boolean;
    }>
  > {
    const alerts: Array<{
      id: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      title: string;
      message: string;
      timestamp: Date;
      acknowledged: boolean;
    }> = [];

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Check for high rejection rate
    const recentApplications = await this.applicationRepository
      .createQueryBuilder('app')
      .where('app.applied_at >= :weekAgo', { weekAgo })
      .getCount();

    const recentRejections = await this.applicationRepository
      .createQueryBuilder('app')
      .where('app.status = :status AND app.updated_at >= :weekAgo', {
        status: ApplicationStatus.REJECTED,
        weekAgo,
      })
      .getCount();

    const rejectionRate =
      recentApplications > 0
        ? (recentRejections / recentApplications) * 100
        : 0;

    if (rejectionRate > 60) {
      alerts.push({
        id: 'high-rejection-rate',
        severity: 'high',
        title: 'High Application Rejection Rate',
        message: `Application rejection rate is ${rejectionRate.toFixed(1)}% this week`,
        timestamp: now,
        acknowledged: false,
      });
    }

    // Check for low job posting activity
    const recentJobs = await this.jobRepository
      .createQueryBuilder('job')
      .where('job.createdAt >= :weekAgo', { weekAgo })
      .getCount();

    if (recentJobs < 5) {
      alerts.push({
        id: 'low-job-activity',
        severity: 'medium',
        title: 'Low Job Posting Activity',
        message: `Only ${recentJobs} jobs posted this week`,
        timestamp: now,
        acknowledged: false,
      });
    }

    return alerts;
  }

  private calculateGrowthRate(current: number, previous: number): number {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  }
}
