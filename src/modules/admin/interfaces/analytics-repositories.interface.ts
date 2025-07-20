import { ApplicationStatus } from '@/modules/applications/enums/application-status.enum';

/**
 * Dashboard analytics repository interface
 */
export interface IDashboardAnalyticsRepository {
  getDashboardMetrics(): Promise<{
    totalUsers: number;
    totalActiveJobs: number;
    totalApplications: number;
    totalCompanies: number;
    userGrowthRate: number;
    jobGrowthRate: number;
    applicationGrowthRate: number;
    companyGrowthRate: number;
  }>;

  getRecentActivity(): Promise<
    Array<{
      id: string;
      type: string;
      description: string;
      timestamp: Date;
      userId?: number;
      entityId?: string;
    }>
  >;

  getSystemAlerts(): Promise<
    Array<{
      id: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      title: string;
      message: string;
      timestamp: Date;
      acknowledged: boolean;
    }>
  >;
}

/**
 * User analytics repository interface
 */
export interface IUserAnalyticsRepository {
  getUserRegistrationTrends(
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
  >;

  getUserDemographics(): Promise<{
    userByRoles: Array<{ name: string; count: number; percentage: number }>;
    userByProvider: Array<{ name: string; count: number; percentage: number }>;
    userByAccountStatus: Array<{
      name: string;
      count: number;
      percentage: number;
    }>;
  }>;

  getUserActivityMetrics(): Promise<{
    activeUsersLast30Days: number;
    accountVerificationRate: number;
    averageProfileCompletionRate: number;
    usersWithCompleteProfiles: number;
    activeJobSeekers: number;
  }>;
}

/**
 * Job analytics repository interface
 */
export interface IJobAnalyticsRepository {
  getJobPostingTrends(
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
  >;

  getCategoryAnalysis(): Promise<
    Array<{
      categoryId: string;
      categoryName: string;
      count: number;
      percentage: number;
      avgApplications: number;
      avgSalary: number;
    }>
  >;

  getEmploymentTypeDistribution(): Promise<
    Array<{
      type: string;
      count: number;
      percentage: number;
      avgSalary: number;
    }>
  >;

  getSalaryAnalytics(): Promise<{
    averageSalary: number;
    medianSalary: number;
    minSalary: number;
    maxSalary: number;
    salaryRanges: Array<{
      range: string;
      count: number;
      percentage: number;
    }>;
  }>;

  getVipJobsAnalytics(): Promise<{
    totalVipJobs: number;
    vipJobsRevenue: number;
    avgVipDuration: number;
    vipConversionRate: number;
    activeVipJobs: number;
  }>;

  getPopularSkills(): Promise<
    Array<{
      skillId: string;
      skillName: string;
      jobCount: number;
      percentage: number;
    }>
  >;
}

/**
 * Application analytics repository interface
 */
export interface IApplicationAnalyticsRepository {
  getApplicationTrends(
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
  >;

  getApplicationStatusDistribution(): Promise<
    Array<{
      status: ApplicationStatus;
      count: number;
      percentage: number;
      avgTimeInStatus: number;
    }>
  >;

  getConversionRates(): Promise<{
    applicationToInterview: number;
    interviewToHire: number;
    overallHireRate: number;
    rejectionRate: number;
  }>;

  getAiAnalysisInsights(): Promise<{
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
  }>;

  getApplicationTimeMetrics(): Promise<{
    averageTimeToResponse: number;
    averageTimeToHire: number;
    averageTimeToRejection: number;
    averageTimeToDecision: number;
  }>;

  getTopPerformingJobs(): Promise<
    Array<{
      jobId: string;
      jobTitle: string;
      companyName: string;
      totalApplications: number;
      hires: number;
      hireRate: number;
      avgAiScore: number;
    }>
  >;
}

/**
 * Company analytics repository interface
 */
export interface ICompanyAnalyticsRepository {
  getCompanyRegistrationTrends(
    startDate: Date,
    endDate: Date,
    interval: 'daily' | 'weekly' | 'monthly',
  ): Promise<
    Array<{
      date: string;
      newCompanies: number;
    }>
  >;

  getCompanySizeDistribution(): Promise<
    Array<{
      sizeRange: string;
      count: number;
      percentage: number;
      avgJobPostings: number;
    }>
  >;

  getIndustryAnalysis(): Promise<
    Array<{
      industry: string;
      count: number;
      percentage: number;
      avgJobPostings: number;
      totalApplications: number;
      avgHireRate: number;
    }>
  >;

  getTopHiringCompanies(): Promise<
    Array<{
      companyId: string;
      companyName: string;
      totalJobs: number;
      totalApplications: number;
      totalHires: number;
      hireRate: number;
      avgTimeToHire: number;
    }>
  >;

  getGeographicDistribution(): Promise<
    Array<{
      location: string;
      count: number;
      percentage: number;
      totalJobs: number;
      avgSalary: number;
    }>
  >;

  getCompanyGrowthMetrics(): Promise<{
    totalCompanies: number;
    activeCompanies: number;
    newCompaniesThisMonth: number;
    growthRate: number;
    avgCompanySize: number;
    verifiedCompanies: number;
  }>;
}
