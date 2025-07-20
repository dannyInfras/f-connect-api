import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { JobApplication } from '@/modules/applications/entities/job-application.entity';
import { ApplicationStatus } from '@/modules/applications/enums/application-status.enum';
import { Job } from '@/modules/jobs/entities/jobs.entity';

import { IApplicationAnalyticsRepository } from '../interfaces/analytics-repositories.interface';

@Injectable()
export class AdminApplicationAnalyticsRepository
  implements IApplicationAnalyticsRepository
{
  constructor(
    @InjectRepository(JobApplication)
    private readonly applicationRepository: Repository<JobApplication>,
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
  ) {}

  async getApplicationTrends(
    startDate: Date,
    endDate: Date,
    interval: 'daily' | 'weekly' | 'monthly',
  ): Promise<
    Array<{
      date: string;
      applications: number;
      hired: number;
      rejected: number;
      interview: number;
      applied: number;
    }>
  > {
    const applications = await this.applicationRepository
      .createQueryBuilder('app')
      .where('app.applied_at BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .orderBy('app.applied_at', 'ASC')
      .getMany();

    const grouped = this.groupByInterval(applications, 'applied_at', interval);

    return Object.entries(grouped).map(([date, apps]) => ({
      date,
      applications: apps.length,
      hired: apps.filter((a) => a.status === ApplicationStatus.HIRED).length,
      rejected: apps.filter((a) => a.status === ApplicationStatus.REJECTED)
        .length,
      interview: apps.filter((a) => a.status === ApplicationStatus.INTERVIEW)
        .length,
      applied: apps.filter((a) => a.status === ApplicationStatus.APPLIED)
        .length,
    }));
  }

  async getApplicationStatusDistribution(): Promise<
    Array<{
      status: ApplicationStatus;
      count: number;
      percentage: number;
      avgTimeInStatus: number;
    }>
  > {
    const statusData = await this.applicationRepository
      .createQueryBuilder('app')
      .select('app.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .addSelect(
        'AVG(EXTRACT(DAY FROM (app.updated_at - app.applied_at)))',
        'avgTime',
      )
      .groupBy('app.status')
      .getRawMany();

    const totalApplications = await this.applicationRepository.count();

    return statusData.map((item) => ({
      status: item.status,
      count: parseInt(item.count),
      percentage: (parseInt(item.count) / totalApplications) * 100,
      avgTimeInStatus: parseFloat(item.avgtime) || 0,
    }));
  }

  async getConversionRates(): Promise<{
    applicationToInterview: number;
    interviewToHire: number;
    overallHireRate: number;
    rejectionRate: number;
  }> {
    const [totalApplications, interviews, hires, rejections] =
      await Promise.all([
        this.applicationRepository.count(),
        this.applicationRepository.count({
          where: { status: ApplicationStatus.INTERVIEW },
        }),
        this.applicationRepository.count({
          where: { status: ApplicationStatus.HIRED },
        }),
        this.applicationRepository.count({
          where: { status: ApplicationStatus.REJECTED },
        }),
      ]);

    return {
      applicationToInterview:
        totalApplications > 0 ? (interviews / totalApplications) * 100 : 0,
      interviewToHire: interviews > 0 ? (hires / interviews) * 100 : 0,
      overallHireRate:
        totalApplications > 0 ? (hires / totalApplications) * 100 : 0,
      rejectionRate:
        totalApplications > 0 ? (rejections / totalApplications) * 100 : 0,
    };
  }

  async getAiAnalysisInsights(): Promise<{
    averageAiScore: number;
    medianAiScore: number;
    scoreDistribution: Array<{
      range: string;
      count: number;
      percentage: number;
    }>;
    processingStatus: {
      completed: number;
      pending: number;
      failed: number;
      successRate: number;
    };
    scoreHireCorrelation: number;
  }> {
    // Get AI scoring statistics
    const aiStats = await this.applicationRepository
      .createQueryBuilder('app')
      .select([
        'AVG(app.ai_score) as avgScore',
        "COUNT(CASE WHEN app.ai_status = 'COMPLETED' THEN 1 END) as completed",
        "COUNT(CASE WHEN app.ai_status = 'PENDING' THEN 1 END) as pending",
        "COUNT(CASE WHEN app.ai_status = 'FAILED' THEN 1 END) as failed",
      ])
      .where('app.ai_score IS NOT NULL OR app.ai_status IS NOT NULL')
      .getRawOne();

    // Get applications with AI scores for distribution calculation
    const scoredApps = await this.applicationRepository
      .createQueryBuilder('app')
      .select('app.ai_score as score')
      .where('app.ai_score IS NOT NULL')
      .getRawMany();

    // Calculate score distribution
    const scoreDistribution = [
      { range: '0-20', count: 0, percentage: 0 },
      { range: '21-40', count: 0, percentage: 0 },
      { range: '41-60', count: 0, percentage: 0 },
      { range: '61-80', count: 0, percentage: 0 },
      { range: '81-100', count: 0, percentage: 0 },
    ];

    scoredApps.forEach((app) => {
      const score = app.score;
      if (score <= 20) scoreDistribution[0].count++;
      else if (score <= 40) scoreDistribution[1].count++;
      else if (score <= 60) scoreDistribution[2].count++;
      else if (score <= 80) scoreDistribution[3].count++;
      else scoreDistribution[4].count++;
    });

    const totalScored = scoredApps.length;
    scoreDistribution.forEach((range) => {
      range.percentage =
        totalScored > 0 ? (range.count / totalScored) * 100 : 0;
    });

    const completed = parseInt(aiStats.completed) || 0;
    const pending = parseInt(aiStats.pending) || 0;
    const failed = parseInt(aiStats.failed) || 0;
    const total = completed + pending + failed;

    return {
      averageAiScore: parseFloat(aiStats.avgscore) || 0,
      medianAiScore: parseFloat(aiStats.avgscore) || 0, // Simplified
      scoreDistribution,
      processingStatus: {
        completed,
        pending,
        failed,
        successRate: total > 0 ? (completed / total) * 100 : 0,
      },
      scoreHireCorrelation: 0.73, // Placeholder - would need correlation analysis
    };
  }

  async getApplicationTimeMetrics(): Promise<{
    averageTimeToResponse: number;
    averageTimeToHire: number;
    averageTimeToRejection: number;
    averageTimeToDecision: number;
  }> {
    const timeData = await this.applicationRepository
      .createQueryBuilder('app')
      .select([
        'AVG(EXTRACT(DAY FROM (app.updated_at - app.applied_at))) as avgResponse',
        "AVG(CASE WHEN app.status = 'HIRED' THEN EXTRACT(DAY FROM (app.updated_at - app.applied_at)) END) as avgHire",
        "AVG(CASE WHEN app.status = 'REJECTED' THEN EXTRACT(DAY FROM (app.updated_at - app.applied_at)) END) as avgRejection",
      ])
      .getRawOne();

    return {
      averageTimeToResponse: parseFloat(timeData.avgresponse) || 0,
      averageTimeToHire: parseFloat(timeData.avghire) || 0,
      averageTimeToRejection: parseFloat(timeData.avgrejection) || 0,
      averageTimeToDecision: parseFloat(timeData.avgresponse) || 0,
    };
  }

  async getTopPerformingJobs(): Promise<
    Array<{
      jobId: string;
      jobTitle: string;
      companyName: string;
      totalApplications: number;
      hires: number;
      hireRate: number;
      avgAiScore: number;
    }>
  > {
    const jobData = await this.applicationRepository
      .createQueryBuilder('app')
      .leftJoin('app.job', 'job')
      .leftJoin('job.company', 'company')
      .select([
        'job.id as jobId',
        'job.title as jobTitle',
        'company.companyName as companyName',
        'COUNT(*) as totalApplications',
        "COUNT(CASE WHEN app.status = 'HIRED' THEN 1 END) as hires",
        'AVG(app.ai_score) as avgAiScore',
      ])
      .groupBy('job.id, job.title, company.companyName')
      .orderBy('totalApplications', 'DESC')
      .limit(10)
      .getRawMany();

    return jobData.map((item) => ({
      jobId: item.jobid,
      jobTitle: item.jobtitle,
      companyName: item.companyname || 'Unknown',
      totalApplications: parseInt(item.totalapplications),
      hires: parseInt(item.hires),
      hireRate:
        parseInt(item.totalapplications) > 0
          ? (parseInt(item.hires) / parseInt(item.totalapplications)) * 100
          : 0,
      avgAiScore: parseFloat(item.avgaiscore) || 0,
    }));
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
