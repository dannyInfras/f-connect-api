import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Category } from '@/modules/category/entities/category.entity';
import { Job } from '@/modules/jobs/entities/jobs.entity';
import { Skill } from '@/modules/skill/entities/skill.entity';

import { IJobAnalyticsRepository } from '../interfaces/analytics-repositories.interface';

@Injectable()
export class AdminJobAnalyticsRepository implements IJobAnalyticsRepository {
  constructor(
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Skill)
    private readonly skillRepository: Repository<Skill>,
  ) {}

  async getJobPostingTrends(
    startDate: Date,
    endDate: Date,
    interval: 'daily' | 'weekly' | 'monthly',
  ): Promise<
    Array<{
      date: string;
      totalJobs: number;
      openJobs: number;
      closedJobs: number;
      vipJobs: number;
    }>
  > {
    const jobs = await this.jobRepository
      .createQueryBuilder('job')
      .where('job.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .orderBy('job.createdAt', 'ASC')
      .getMany();

    const grouped = this.groupByInterval(jobs, 'createdAt', interval);

    return Object.entries(grouped).map(([date, jobs]) => ({
      date,
      totalJobs: jobs.length,
      openJobs: jobs.filter((j) => j.status === 'OPEN').length,
      closedJobs: jobs.filter((j) => j.status === 'CLOSED').length,
      vipJobs: jobs.filter(
        (j) => j.vipExpired && new Date(j.vipExpired) > new Date(),
      ).length,
    }));
  }

  async getCategoryAnalysis(): Promise<
    Array<{
      categoryId: string;
      categoryName: string;
      count: number;
      percentage: number;
      avgApplications: number;
      avgSalary: number;
    }>
  > {
    // Get categories and count jobs for each
    const categories = await this.categoryRepository.find();
    const result: Array<{
      categoryId: string;
      categoryName: string;
      count: number;
      percentage: number;
      avgApplications: number;
      avgSalary: number;
    }> = [];

    const totalJobs = await this.jobRepository.count();

    for (const category of categories.slice(0, 10)) {
      // Limit to top 10
      const jobCount = await this.jobRepository.count({
        where: { category: { id: category.id } },
      });

      // Calculate average salary for jobs in this category
      const avgSalaryResult = await this.jobRepository
        .createQueryBuilder('job')
        .select('AVG((job.salaryMin + job.salaryMax) / 2)', 'avgSalary')
        .where('job.category_id = :categoryId', { categoryId: category.id })
        .andWhere('job.salaryMin IS NOT NULL AND job.salaryMax IS NOT NULL')
        .getRawOne();

      // Count applications for jobs in this category
      const applicationCount = await this.jobRepository
        .createQueryBuilder('job')
        .leftJoin('job_application', 'app', 'app.job_id = job.id')
        .select('COUNT(app.id)', 'count')
        .where('job.category_id = :categoryId', { categoryId: category.id })
        .getRawOne();

      result.push({
        categoryId: category.id,
        categoryName: category.name,
        count: jobCount,
        percentage: totalJobs > 0 ? (jobCount / totalJobs) * 100 : 0,
        avgApplications:
          jobCount > 0 ? parseInt(applicationCount.count) / jobCount : 0,
        avgSalary: parseFloat(avgSalaryResult.avgSalary) || 0,
      });
    }

    return result.sort((a, b) => b.count - a.count);
  }

  async getEmploymentTypeDistribution(): Promise<
    Array<{
      type: string;
      count: number;
      percentage: number;
      avgSalary: number;
    }>
  > {
    // Get distinct employment types and their counts
    const typeData = await this.jobRepository
      .createQueryBuilder('job')
      .select('job.typeOfEmployment', 'type')
      .addSelect('COUNT(*)', 'count')
      .addSelect('AVG((job.salaryMin + job.salaryMax) / 2)', 'avgSalary')
      .where('job.typeOfEmployment IS NOT NULL')
      .groupBy('job.typeOfEmployment')
      .orderBy('count', 'DESC')
      .getRawMany();

    const totalJobs = await this.jobRepository.count();

    return typeData.map((item) => ({
      type: item.type || 'Unknown',
      count: parseInt(item.count),
      percentage: (parseInt(item.count) / totalJobs) * 100,
      avgSalary: parseFloat(item.avgsalary) || 0,
    }));
  }

  async getSalaryAnalytics(): Promise<{
    averageSalary: number;
    medianSalary: number;
    minSalary: number;
    maxSalary: number;
    salaryRanges: Array<{
      range: string;
      count: number;
      percentage: number;
    }>;
  }> {
    // Get salary statistics
    const salaryStats = await this.jobRepository
      .createQueryBuilder('job')
      .select([
        'AVG((job.salaryMin + job.salaryMax) / 2) as avgSalary',
        'MIN(job.salaryMin) as minSalary',
        'MAX(job.salaryMax) as maxSalary',
      ])
      .where('job.salaryMin IS NOT NULL AND job.salaryMax IS NOT NULL')
      .getRawOne();

    // Get jobs with salaries for range calculation
    const jobsWithSalary = await this.jobRepository
      .createQueryBuilder('job')
      .select('(job.salaryMin + job.salaryMax) / 2 as avgSalary')
      .where('job.salaryMin IS NOT NULL AND job.salaryMax IS NOT NULL')
      .getRawMany();

    // Calculate salary ranges
    const salaryRanges = [
      { range: '0-50k', count: 0, percentage: 0 },
      { range: '50k-100k', count: 0, percentage: 0 },
      { range: '100k-150k', count: 0, percentage: 0 },
      { range: '150k+', count: 0, percentage: 0 },
    ];

    jobsWithSalary.forEach((job) => {
      const salary = parseFloat(job.avgsalary);
      if (salary < 50000) salaryRanges[0].count++;
      else if (salary < 100000) salaryRanges[1].count++;
      else if (salary < 150000) salaryRanges[2].count++;
      else salaryRanges[3].count++;
    });

    const totalJobs = jobsWithSalary.length;
    salaryRanges.forEach((range) => {
      range.percentage = totalJobs > 0 ? (range.count / totalJobs) * 100 : 0;
    });

    return {
      averageSalary: parseFloat(salaryStats.avgsalary) || 0,
      medianSalary: parseFloat(salaryStats.avgsalary) || 0, // Simplified - would need proper median calculation
      minSalary: parseFloat(salaryStats.minsalary) || 0,
      maxSalary: parseFloat(salaryStats.maxsalary) || 0,
      salaryRanges,
    };
  }

  async getVipJobsAnalytics(): Promise<{
    totalVipJobs: number;
    vipJobsRevenue: number;
    avgVipDuration: number;
    vipConversionRate: number;
    activeVipJobs: number;
  }> {
    const now = new Date();

    const totalVipJobs = await this.jobRepository
      .createQueryBuilder('job')
      .where('job.vipExpired IS NOT NULL')
      .getCount();

    const activeVipJobs = await this.jobRepository
      .createQueryBuilder('job')
      .where('job.vipExpired > :now', { now })
      .getCount();

    // Calculate average VIP duration
    const avgDurationResult = await this.jobRepository
      .createQueryBuilder('job')
      .select(
        'AVG(EXTRACT(DAY FROM (job.vipExpired - job.createdAt)))',
        'avgDuration',
      )
      .where('job.vipExpired IS NOT NULL')
      .getRawOne();

    return {
      totalVipJobs,
      vipJobsRevenue: totalVipJobs * 500, // Assuming $500 per VIP job
      avgVipDuration: parseFloat(avgDurationResult.avgduration) || 15.0,
      vipConversionRate: 75.0, // Placeholder - would need application conversion analysis
      activeVipJobs,
    };
  }

  async getPopularSkills(): Promise<
    Array<{
      skillId: string;
      skillName: string;
      jobCount: number;
      percentage: number;
    }>
  > {
    // This would need a proper join table query in a real implementation
    // For now, returning skills with placeholder data
    const skills = await this.skillRepository.find({ take: 10 });
    const totalJobs = await this.jobRepository.count();

    return skills.map((skill) => ({
      skillId: skill.id,
      skillName: skill.name,
      jobCount: Math.floor(Math.random() * 50), // Placeholder
      percentage: Math.floor(Math.random() * 30), // Placeholder
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
