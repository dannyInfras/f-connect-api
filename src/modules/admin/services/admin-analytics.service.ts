import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { plainToClass } from 'class-transformer';

import { Action } from '@/shared/acl/action.constant';
import { Actor } from '@/shared/acl/actor.constant';
import { AppLogger } from '@/shared/logger/logger.service';
import { RequestContext } from '@/shared/request-context/request-context.dto';

import { ANALYTICS_REPOSITORY_TOKENS } from '../constants/analytics-tokens';
import {
  AiAnalysisInsightsDto,
  ApplicationAnalyticsResponseDto,
  ApplicationTrendDto,
  ConversionRatesDto,
  StatusDistributionDto,
  TimeMetricsDto,
  TopPerformingJobDto,
} from '../dtos/application-analytics.dto';
import {
  CompanyAnalyticsResponseDto,
  CompanyGrowthMetricsDto,
  CompanyRegistrationTrendDto,
  CompanySizeDistributionDto,
  GeographicDistributionDto,
  HiringActivityDto,
  IndustryAnalysisDto,
} from '../dtos/company-analytics.dto';
import {
  AdminAlertDto,
  DashboardAnalyticsResponseDto,
  DashboardMetricsDto,
  RecentActivityDto,
} from '../dtos/dashboard-analytics.dto';
import {
  CategoryAnalysisDto,
  EmploymentTypeDto,
  JobAnalyticsResponseDto,
  JobPostingTrendDto,
  PopularSkillDto,
  SalaryAnalyticsDto,
  VipJobsAnalyticsDto,
} from '../dtos/job-analytics.dto';
import {
  RegistrationTrendDto,
  UserActivityMetricsDto,
  UserAnalyticsResponseDto,
  UserDemographicsDto,
} from '../dtos/user-analytics.dto';
import {
  IApplicationAnalyticsRepository,
  ICompanyAnalyticsRepository,
  IDashboardAnalyticsRepository,
  IJobAnalyticsRepository,
  IUserAnalyticsRepository,
} from '../interfaces/analytics-repositories.interface';
import { AdminAnalyticsAclService } from './admin-analytics-acl.service';

/**
 * Service for admin analytics operations
 * Uses repository pattern to separate business logic from data access
 * Follows SOLID principles for better maintainability and testability
 */
@Injectable()
export class AdminAnalyticsService {
  constructor(
    @Inject(ANALYTICS_REPOSITORY_TOKENS.DASHBOARD_ANALYTICS_REPOSITORY)
    private readonly dashboardRepository: IDashboardAnalyticsRepository,
    @Inject(ANALYTICS_REPOSITORY_TOKENS.USER_ANALYTICS_REPOSITORY)
    private readonly userRepository: IUserAnalyticsRepository,
    @Inject(ANALYTICS_REPOSITORY_TOKENS.JOB_ANALYTICS_REPOSITORY)
    private readonly jobRepository: IJobAnalyticsRepository,
    @Inject(ANALYTICS_REPOSITORY_TOKENS.APPLICATION_ANALYTICS_REPOSITORY)
    private readonly applicationRepository: IApplicationAnalyticsRepository,
    @Inject(ANALYTICS_REPOSITORY_TOKENS.COMPANY_ANALYTICS_REPOSITORY)
    private readonly companyRepository: ICompanyAnalyticsRepository,
    private readonly aclService: AdminAnalyticsAclService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(AdminAnalyticsService.name);
  }

  /**
   * Get dashboard analytics with key metrics and overview
   */
  async getDashboardAnalytics(
    ctx: RequestContext,
    admin: Actor,
  ): Promise<DashboardAnalyticsResponseDto> {
    this.logger.log(ctx, `${this.getDashboardAnalytics.name} was called`);

    // Check permissions
    if (!this.aclService.forActor(admin).canDoAction(Action.Read)) {
      throw new UnauthorizedException(
        'Insufficient permissions to view analytics',
      );
    }

    const [dashboardMetrics, recentActivity, alerts] = await Promise.all([
      this.dashboardRepository.getDashboardMetrics(),
      this.dashboardRepository.getRecentActivity(),
      this.dashboardRepository.getSystemAlerts(),
    ]);

    return plainToClass(
      DashboardAnalyticsResponseDto,
      {
        dashboardMetrics: plainToClass(DashboardMetricsDto, dashboardMetrics, {
          excludeExtraneousValues: true,
        }),
        recentActivity: recentActivity.map((activity) =>
          plainToClass(RecentActivityDto, activity, {
            excludeExtraneousValues: true,
          }),
        ),
        alerts: alerts.map((alert) =>
          plainToClass(AdminAlertDto, alert, { excludeExtraneousValues: true }),
        ),
      },
      { excludeExtraneousValues: true },
    );
  }

  /**
   * Get user analytics including trends and demographics
   */
  async getUserAnalytics(
    ctx: RequestContext,
    admin: Actor,
    startDate?: Date,
    endDate?: Date,
    interval: 'daily' | 'weekly' | 'monthly' = 'monthly',
  ): Promise<UserAnalyticsResponseDto> {
    this.logger.log(ctx, `${this.getUserAnalytics.name} was called`);

    // Check permissions
    if (!this.aclService.forActor(admin).canDoAction(Action.Read)) {
      throw new UnauthorizedException(
        'Insufficient permissions to view user analytics',
      );
    }

    // Set default date range if not provided
    const end = endDate || new Date();
    const start =
      startDate || new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000); // 90 days default

    const [registrationTrends, demographics, activityMetrics] =
      await Promise.all([
        this.userRepository.getUserRegistrationTrends(start, end, interval),
        this.userRepository.getUserDemographics(),
        this.userRepository.getUserActivityMetrics(),
      ]);

    return plainToClass(
      UserAnalyticsResponseDto,
      {
        registrationTrends: registrationTrends.map((trend) =>
          plainToClass(RegistrationTrendDto, trend, {
            excludeExtraneousValues: true,
          }),
        ),
        demographics: plainToClass(UserDemographicsDto, demographics, {
          excludeExtraneousValues: true,
        }),
        activityMetrics: plainToClass(UserActivityMetricsDto, activityMetrics, {
          excludeExtraneousValues: true,
        }),
      },
      { excludeExtraneousValues: true },
    );
  }

  /**
   * Get job market analytics
   */
  async getJobAnalytics(
    ctx: RequestContext,
    admin: Actor,
    startDate?: Date,
    endDate?: Date,
    interval: 'daily' | 'weekly' | 'monthly' = 'monthly',
  ): Promise<JobAnalyticsResponseDto> {
    this.logger.log(ctx, `${this.getJobAnalytics.name} was called`);

    // Check permissions
    if (!this.aclService.forActor(admin).canDoAction(Action.Read)) {
      throw new UnauthorizedException(
        'Insufficient permissions to view job analytics',
      );
    }

    // Set default date range if not provided (extend to 365 days to avoid empty trends)
    const end = endDate || new Date();
    const start =
      startDate || new Date(end.getTime() - 365 * 24 * 60 * 60 * 1000);

    const [
      jobPostingTrends,
      categoryAnalysis,
      employmentTypeDistribution,
      salaryAnalytics,
      vipJobsAnalytics,
      popularSkills,
    ] = await Promise.all([
      this.jobRepository.getJobPostingTrends(start, end, interval),
      this.jobRepository.getCategoryAnalysis(),
      this.jobRepository.getEmploymentTypeDistribution(),
      this.jobRepository.getSalaryAnalytics(),
      this.jobRepository.getVipJobsAnalytics(),
      this.jobRepository.getPopularSkills(),
    ]);

    return plainToClass(
      JobAnalyticsResponseDto,
      {
        jobPostingTrends: jobPostingTrends.map((trend) =>
          plainToClass(JobPostingTrendDto, trend, {
            excludeExtraneousValues: true,
          }),
        ),
        categoryAnalysis: categoryAnalysis.map((category) =>
          plainToClass(CategoryAnalysisDto, category, {
            excludeExtraneousValues: true,
          }),
        ),
        employmentTypeDistribution: employmentTypeDistribution.map((type) =>
          plainToClass(EmploymentTypeDto, type, {
            excludeExtraneousValues: true,
          }),
        ),
        salaryAnalytics: plainToClass(SalaryAnalyticsDto, salaryAnalytics, {
          excludeExtraneousValues: true,
        }),
        vipJobsAnalytics: plainToClass(VipJobsAnalyticsDto, vipJobsAnalytics, {
          excludeExtraneousValues: true,
        }),
        popularSkills: popularSkills.map((skill) =>
          plainToClass(PopularSkillDto, skill, {
            excludeExtraneousValues: true,
          }),
        ),
      },
      { excludeExtraneousValues: true },
    );
  }

  /**
   * Get application analytics including conversion rates and AI insights
   */
  async getApplicationAnalytics(
    ctx: RequestContext,
    admin: Actor,
    startDate?: Date,
    endDate?: Date,
    interval: 'daily' | 'weekly' | 'monthly' = 'monthly',
  ): Promise<ApplicationAnalyticsResponseDto> {
    this.logger.log(ctx, `${this.getApplicationAnalytics.name} was called`);

    // Check permissions
    if (!this.aclService.forActor(admin).canDoAction(Action.Read)) {
      throw new UnauthorizedException(
        'Insufficient permissions to view application analytics',
      );
    }

    // Set default date range if not provided
    const end = endDate || new Date();
    const start =
      startDate || new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000);

    const [
      applicationTrends,
      statusDistribution,
      conversionRates,
      aiAnalysisInsights,
      timeMetrics,
      topPerformingJobs,
    ] = await Promise.all([
      this.applicationRepository.getApplicationTrends(start, end, interval),
      this.applicationRepository.getApplicationStatusDistribution(),
      this.applicationRepository.getConversionRates(),
      this.applicationRepository.getAiAnalysisInsights(),
      this.applicationRepository.getApplicationTimeMetrics(),
      this.applicationRepository.getTopPerformingJobs(),
    ]);

    return plainToClass(
      ApplicationAnalyticsResponseDto,
      {
        applicationTrends: applicationTrends.map((trend) =>
          plainToClass(ApplicationTrendDto, trend, {
            excludeExtraneousValues: true,
          }),
        ),
        statusDistribution: statusDistribution.map((status) =>
          plainToClass(StatusDistributionDto, status, {
            excludeExtraneousValues: true,
          }),
        ),
        conversionRates: plainToClass(ConversionRatesDto, conversionRates, {
          excludeExtraneousValues: true,
        }),
        aiAnalysisInsights: plainToClass(
          AiAnalysisInsightsDto,
          aiAnalysisInsights,
          { excludeExtraneousValues: true },
        ),
        timeMetrics: plainToClass(TimeMetricsDto, timeMetrics, {
          excludeExtraneousValues: true,
        }),
        topPerformingJobs: topPerformingJobs.map((job) =>
          plainToClass(TopPerformingJobDto, job, {
            excludeExtraneousValues: true,
          }),
        ),
      },
      { excludeExtraneousValues: true },
    );
  }

  /**
   * Get company analytics including growth and industry insights
   */
  async getCompanyAnalytics(
    ctx: RequestContext,
    admin: Actor,
    startDate?: Date,
    endDate?: Date,
    interval: 'daily' | 'weekly' | 'monthly' = 'monthly',
  ): Promise<CompanyAnalyticsResponseDto> {
    this.logger.log(ctx, `${this.getCompanyAnalytics.name} was called`);

    // Check permissions
    if (!this.aclService.forActor(admin).canDoAction(Action.Read)) {
      throw new UnauthorizedException(
        'Insufficient permissions to view company analytics',
      );
    }

    // Set default date range if not provided
    const end = endDate || new Date();
    const start =
      startDate || new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000);

    const [
      registrationTrends,
      sizeDistribution,
      industryAnalysis,
      topHiringCompanies,
      geographicDistribution,
      growthMetrics,
    ] = await Promise.all([
      this.companyRepository.getCompanyRegistrationTrends(start, end, interval),
      this.companyRepository.getCompanySizeDistribution(),
      this.companyRepository.getIndustryAnalysis(),
      this.companyRepository.getTopHiringCompanies(),
      this.companyRepository.getGeographicDistribution(),
      this.companyRepository.getCompanyGrowthMetrics(),
    ]);

    return plainToClass(
      CompanyAnalyticsResponseDto,
      {
        registrationTrends: registrationTrends.map((trend) =>
          plainToClass(CompanyRegistrationTrendDto, trend, {
            excludeExtraneousValues: true,
          }),
        ),
        sizeDistribution: sizeDistribution.map((size) =>
          plainToClass(CompanySizeDistributionDto, size, {
            excludeExtraneousValues: true,
          }),
        ),
        industryAnalysis: industryAnalysis.map((industry) =>
          plainToClass(IndustryAnalysisDto, industry, {
            excludeExtraneousValues: true,
          }),
        ),
        topHiringCompanies: topHiringCompanies.map((company) =>
          plainToClass(HiringActivityDto, company, {
            excludeExtraneousValues: true,
          }),
        ),
        geographicDistribution: geographicDistribution.map((location) =>
          plainToClass(GeographicDistributionDto, location, {
            excludeExtraneousValues: true,
          }),
        ),
        growthMetrics: plainToClass(CompanyGrowthMetricsDto, growthMetrics, {
          excludeExtraneousValues: true,
        }),
      },
      { excludeExtraneousValues: true },
    );
  }
}
