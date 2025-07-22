import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull,Not, Repository } from 'typeorm';

import { JobApplication } from '@/modules/applications/entities/job-application.entity';
import { Company } from '@/modules/company/entities/company.entity';
import { Job } from '@/modules/jobs/entities/jobs.entity';

import { ICompanyAnalyticsRepository } from '../interfaces/analytics-repositories.interface';

@Injectable()
export class AdminCompanyAnalyticsRepository
  implements ICompanyAnalyticsRepository
{
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
    @InjectRepository(JobApplication)
    private readonly applicationRepository: Repository<JobApplication>,
  ) {}

  async getCompanyRegistrationTrends(
    startDate: Date,
    endDate: Date,
    interval: 'daily' | 'weekly' | 'monthly',
  ): Promise<
    Array<{
      date: string;
      newCompanies: number;
    }>
  > {
    const companies = await this.companyRepository
      .createQueryBuilder('company')
      .where('company.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .orderBy('company.createdAt', 'ASC')
      .getMany();

    const grouped = this.groupByInterval(companies, 'createdAt', interval);

    return Object.entries(grouped).map(([date, companies]) => ({
      date,
      newCompanies: companies.length,
    }));
  }

  async getCompanySizeDistribution(): Promise<
    Array<{
      sizeRange: string;
      count: number;
      percentage: number;
      avgJobPostings: number;
    }>
  > {
    // Get companies with their job counts
    const companies = await this.companyRepository
      .createQueryBuilder('company')
      .leftJoin('job', 'job', 'job.company_id = company.id')
      .select(['company.employees', 'COUNT(DISTINCT job.id) as jobCount'])
      .groupBy('company.id, company.employees')
      .getRawMany();

    const sizeRanges = [
      { range: '1-10', min: 1, max: 10 },
      { range: '11-50', min: 11, max: 50 },
      { range: '51-200', min: 51, max: 200 },
      { range: '201-1000', min: 201, max: 1000 },
      { range: '1000+', min: 1001, max: Infinity },
    ];

    const distribution = sizeRanges.map((range) => ({
      sizeRange: range.range,
      count: 0,
      percentage: 0,
      avgJobPostings: 0,
      totalJobs: 0,
    }));

    companies.forEach((company) => {
      const employees = company.employees || 0;
      const jobCount = parseInt(company.jobcount) || 0;

      const rangeIndex = sizeRanges.findIndex(
        (range) => employees >= range.min && employees <= range.max,
      );

      if (rangeIndex >= 0) {
        distribution[rangeIndex].count++;
        distribution[rangeIndex].totalJobs += jobCount;
      }
    });

    const totalCompanies = companies.length;
    distribution.forEach((range) => {
      range.percentage =
        totalCompanies > 0 ? (range.count / totalCompanies) * 100 : 0;
      range.avgJobPostings =
        range.count > 0 ? range.totalJobs / range.count : 0;
    });

    return distribution;
  }

  async getIndustryAnalysis(): Promise<
    Array<{
      industry: string;
      count: number;
      percentage: number;
      avgJobPostings: number;
      totalApplications: number;
      avgHireRate: number;
    }>
  > {
    const industryData = await this.companyRepository
      .createQueryBuilder('company')
      .leftJoin('job', 'job', 'job.company_id = company.id')
      .leftJoin('job_application', 'app', 'app.job_id = job.id')
      .select([
        'company.industry',
        'COUNT(DISTINCT company.id) as companyCount',
        'COUNT(DISTINCT job.id) as jobCount',
        'COUNT(app.id) as applicationCount',
        "COUNT(CASE WHEN app.status = 'HIRED' THEN 1 END) as hireCount",
      ])
      .where('company.industry IS NOT NULL')
      .groupBy('company.industry')
      .orderBy('companyCount', 'DESC')
      .limit(10)
      .getRawMany();

    const totalCompanies = await this.companyRepository.count({
      where: { industry: Not(IsNull()) },
    });

    return industryData.map((item) => ({
      industry: item.industry || 'Unknown',
      count: parseInt(item.companycount),
      percentage: (parseInt(item.companycount) / totalCompanies) * 100,
      avgJobPostings:
        parseInt(item.companycount) > 0
          ? parseInt(item.jobcount) / parseInt(item.companycount)
          : 0,
      totalApplications: parseInt(item.applicationcount),
      avgHireRate:
        parseInt(item.applicationcount) > 0
          ? (parseInt(item.hirecount) / parseInt(item.applicationcount)) * 100
          : 0,
    }));
  }

  async getTopHiringCompanies(): Promise<
    Array<{
      companyId: string;
      companyName: string;
      totalJobs: number;
      totalApplications: number;
      totalHires: number;
      hireRate: number;
      avgTimeToHire: number;
    }>
  > {
    const hiringData = await this.companyRepository
      .createQueryBuilder('company')
      .leftJoin('job', 'job', 'job.company_id = company.id')
      .leftJoin('job_application', 'app', 'app.job_id = job.id')
      .select([
        'company.id as companyId',
        'company.companyName',
        'COUNT(DISTINCT job.id) as totalJobs',
        'COUNT(app.id) as totalApplications',
        "COUNT(CASE WHEN app.status = 'HIRED' THEN 1 END) as totalHires",
        'AVG(EXTRACT(DAY FROM (app.updated_at - app.applied_at))) as avgTimeToHire',
      ])
      .groupBy('company.id, company.companyName')
      .orderBy('totalJobs', 'DESC')
      .limit(10)
      .getRawMany();

    return hiringData.map((item) => ({
      companyId: item.companyid,
      companyName: item.companyname,
      totalJobs: parseInt(item.totaljobs),
      totalApplications: parseInt(item.totalapplications),
      totalHires: parseInt(item.totalhires),
      hireRate:
        parseInt(item.totalapplications) > 0
          ? (parseInt(item.totalhires) / parseInt(item.totalapplications)) * 100
          : 0,
      avgTimeToHire: parseFloat(item.avgtimetohire) || 0,
    }));
  }

  async getGeographicDistribution(): Promise<
    Array<{
      location: string;
      count: number;
      percentage: number;
      totalJobs: number;
      avgSalary: number;
    }>
  > {
    // Simplified geographic distribution - would need address parsing in real implementation
    const locationData = await this.companyRepository
      .createQueryBuilder('company')
      .leftJoin('job', 'job', 'job.company_id = company.id')
      .select([
        'company.address[0] as location', // Assuming first address element is city
        'COUNT(DISTINCT company.id) as companyCount',
        'COUNT(job.id) as jobCount',
        'AVG((job.salaryMin + job.salaryMax) / 2) as avgSalary',
      ])
      .where(
        'company.address IS NOT NULL AND array_length(company.address, 1) > 0',
      )
      .groupBy('company.address[0]')
      .orderBy('companyCount', 'DESC')
      .limit(10)
      .getRawMany();

    const totalCompanies = await this.companyRepository.count();

    return locationData.map((item) => ({
      location: item.location || 'Unknown',
      count: parseInt(item.companycount),
      percentage: (parseInt(item.companycount) / totalCompanies) * 100,
      totalJobs: parseInt(item.jobcount),
      avgSalary: parseFloat(item.avgsalary) || 0,
    }));
  }

  async getCompanyGrowthMetrics(): Promise<{
    totalCompanies: number;
    activeCompanies: number;
    newCompaniesThisMonth: number;
    growthRate: number;
    avgCompanySize: number;
    verifiedCompanies: number;
  }> {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const totalCompanies = await this.companyRepository.count();

    const newCompaniesThisMonth = await this.companyRepository
      .createQueryBuilder('company')
      .where('company.createdAt >= :thisMonth', { thisMonth })
      .getCount();

    const lastMonthCompanies = await this.companyRepository
      .createQueryBuilder('company')
      .where('company.createdAt < :lastMonth', { lastMonth })
      .getCount();

    // Get active companies (posted jobs in last 30 days)
    const activeCompanies = await this.companyRepository
      .createQueryBuilder('company')
      .leftJoin('job', 'job', 'job.company_id = company.id')
      .where('job.createdAt >= :thirtyDaysAgo', { thirtyDaysAgo })
      .select('COUNT(DISTINCT company.id)', 'count')
      .getRawOne()
      .then((result) => parseInt(result.count) || 0);

    // Get average company size
    const avgSizeResult = await this.companyRepository
      .createQueryBuilder('company')
      .select('AVG(company.employees)', 'avgSize')
      .where('company.employees IS NOT NULL')
      .getRawOne();

    // Get verified companies (assuming companies with business license)
    const verifiedCompanies = await this.companyRepository.count({
      where: { businessLicenseUrl: Not(IsNull()) },
    });

    return {
      totalCompanies,
      activeCompanies,
      newCompaniesThisMonth,
      growthRate: this.calculateGrowthRate(totalCompanies, lastMonthCompanies),
      avgCompanySize: parseFloat(avgSizeResult.avgsize) || 0,
      verifiedCompanies,
    };
  }

  private calculateGrowthRate(current: number, previous: number): number {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
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
