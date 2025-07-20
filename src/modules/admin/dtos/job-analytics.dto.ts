import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

/**
 * Job posting trend data point DTO
 */
export class JobPostingTrendDto {
  @Expose()
  @ApiProperty({
    description: 'Date for the data point',
    example: '2024-01-15',
  })
  date: string;

  @Expose()
  @ApiProperty({ description: 'Total jobs posted on this date', example: 12 })
  totalJobs: number;

  @Expose()
  @ApiProperty({ description: 'Open jobs on this date', example: 10 })
  openJobs: number;

  @Expose()
  @ApiProperty({ description: 'Closed jobs on this date', example: 2 })
  closedJobs: number;

  @Expose()
  @ApiProperty({ description: 'VIP jobs posted on this date', example: 3 })
  vipJobs: number;
}

/**
 * Category analysis DTO
 */
export class CategoryAnalysisDto {
  @Expose()
  @ApiProperty({ description: 'Category ID', example: '1' })
  categoryId: string;

  @Expose()
  @ApiProperty({
    description: 'Category name',
    example: 'Software Development',
  })
  categoryName: string;

  @Expose()
  @ApiProperty({ description: 'Number of jobs in this category', example: 45 })
  count: number;

  @Expose()
  @ApiProperty({ description: 'Percentage of total jobs', example: 35.2 })
  percentage: number;

  @Expose()
  @ApiProperty({
    description: 'Average applications per job in this category',
    example: 28.5,
  })
  avgApplications: number;

  @Expose()
  @ApiProperty({
    description: 'Average salary for jobs in this category',
    example: 85000,
  })
  avgSalary: number;
}

/**
 * Employment type distribution DTO
 */
export class EmploymentTypeDto {
  @Expose()
  @ApiProperty({ description: 'Employment type', example: 'FULL_TIME' })
  type: string;

  @Expose()
  @ApiProperty({ description: 'Number of jobs of this type', example: 68 })
  count: number;

  @Expose()
  @ApiProperty({ description: 'Percentage of total jobs', example: 53.1 })
  percentage: number;

  @Expose()
  @ApiProperty({
    description: 'Average salary for this employment type',
    example: 92000,
  })
  avgSalary: number;
}

/**
 * Salary range distribution DTO
 */
export class SalaryRangeDto {
  @Expose()
  @ApiProperty({ description: 'Salary range', example: '50k-100k' })
  range: string;

  @Expose()
  @ApiProperty({ description: 'Number of jobs in this range', example: 32 })
  count: number;

  @Expose()
  @ApiProperty({ description: 'Percentage of total jobs', example: 25.0 })
  percentage: number;
}

/**
 * Salary analytics DTO
 */
export class SalaryAnalyticsDto {
  @Expose()
  @ApiProperty({
    description: 'Average salary across all jobs',
    example: 78500,
  })
  averageSalary: number;

  @Expose()
  @ApiProperty({ description: 'Median salary across all jobs', example: 75000 })
  medianSalary: number;

  @Expose()
  @ApiProperty({ description: 'Minimum salary posted', example: 35000 })
  minSalary: number;

  @Expose()
  @ApiProperty({ description: 'Maximum salary posted', example: 180000 })
  maxSalary: number;

  @Expose()
  @ApiProperty({
    type: [SalaryRangeDto],
    description: 'Salary distribution by ranges',
  })
  @Type(() => SalaryRangeDto)
  salaryRanges: SalaryRangeDto[];
}

/**
 * VIP jobs analytics DTO
 */
export class VipJobsAnalyticsDto {
  @Expose()
  @ApiProperty({ description: 'Total number of VIP jobs posted', example: 23 })
  totalVipJobs: number;

  @Expose()
  @ApiProperty({ description: 'Total revenue from VIP jobs', example: 11500 })
  vipJobsRevenue: number;

  @Expose()
  @ApiProperty({ description: 'Average VIP duration in days', example: 15.2 })
  avgVipDuration: number;

  @Expose()
  @ApiProperty({
    description: 'VIP jobs conversion rate percentage',
    example: 73.9,
  })
  vipConversionRate: number;

  @Expose()
  @ApiProperty({ description: 'Active VIP jobs currently', example: 8 })
  activeVipJobs: number;
}

/**
 * Popular skills DTO
 */
export class PopularSkillDto {
  @Expose()
  @ApiProperty({ description: 'Skill ID', example: '1' })
  skillId: string;

  @Expose()
  @ApiProperty({ description: 'Skill name', example: 'JavaScript' })
  skillName: string;

  @Expose()
  @ApiProperty({
    description: 'Number of jobs requiring this skill',
    example: 42,
  })
  jobCount: number;

  @Expose()
  @ApiProperty({
    description: 'Percentage of jobs requiring this skill',
    example: 32.8,
  })
  percentage: number;
}

/**
 * Job market analytics response DTO
 */
export class JobAnalyticsResponseDto {
  @Expose()
  @ApiProperty({
    type: [JobPostingTrendDto],
    description: 'Job posting trends over time',
  })
  @Type(() => JobPostingTrendDto)
  jobPostingTrends: JobPostingTrendDto[];

  @Expose()
  @ApiProperty({
    type: [CategoryAnalysisDto],
    description: 'Job analysis by category',
  })
  @Type(() => CategoryAnalysisDto)
  categoryAnalysis: CategoryAnalysisDto[];

  @Expose()
  @ApiProperty({
    type: [EmploymentTypeDto],
    description: 'Distribution by employment type',
  })
  @Type(() => EmploymentTypeDto)
  employmentTypeDistribution: EmploymentTypeDto[];

  @Expose()
  @ApiProperty({
    type: SalaryAnalyticsDto,
    description: 'Salary insights and distribution',
  })
  @Type(() => SalaryAnalyticsDto)
  salaryAnalytics: SalaryAnalyticsDto;

  @Expose()
  @ApiProperty({
    type: VipJobsAnalyticsDto,
    description: 'VIP jobs performance metrics',
  })
  @Type(() => VipJobsAnalyticsDto)
  vipJobsAnalytics: VipJobsAnalyticsDto;

  @Expose()
  @ApiProperty({
    type: [PopularSkillDto],
    description: 'Most demanded skills in job postings',
  })
  @Type(() => PopularSkillDto)
  popularSkills: PopularSkillDto[];
}
