import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

/**
 * Company registration trend DTO
 */
export class CompanyRegistrationTrendDto {
  @Expose()
  @ApiProperty({
    description: 'Date for the data point',
    example: '2024-01-15',
  })
  date: string;

  @Expose()
  @ApiProperty({
    description: 'Number of new companies registered',
    example: 5,
  })
  newCompanies: number;
}

/**
 * Company size distribution DTO
 */
export class CompanySizeDistributionDto {
  @Expose()
  @ApiProperty({ description: 'Company size range', example: '11-50' })
  sizeRange: string;

  @Expose()
  @ApiProperty({
    description: 'Number of companies in this range',
    example: 45,
  })
  count: number;

  @Expose()
  @ApiProperty({ description: 'Percentage of total companies', example: 32.1 })
  percentage: number;

  @Expose()
  @ApiProperty({
    description: 'Average job postings per company in this range',
    example: 8.5,
  })
  avgJobPostings: number;
}

/**
 * Industry analysis DTO
 */
export class IndustryAnalysisDto {
  @Expose()
  @ApiProperty({ description: 'Industry name', example: 'Technology' })
  industry: string;

  @Expose()
  @ApiProperty({
    description: 'Number of companies in this industry',
    example: 78,
  })
  count: number;

  @Expose()
  @ApiProperty({ description: 'Percentage of total companies', example: 31.2 })
  percentage: number;

  @Expose()
  @ApiProperty({
    description: 'Average job postings per company',
    example: 12.3,
  })
  avgJobPostings: number;

  @Expose()
  @ApiProperty({
    description: 'Total job applications in this industry',
    example: 1245,
  })
  totalApplications: number;

  @Expose()
  @ApiProperty({
    description: 'Average hire rate in this industry',
    example: 23.7,
  })
  avgHireRate: number;
}

/**
 * Hiring activity DTO
 */
export class HiringActivityDto {
  @Expose()
  @ApiProperty({ description: 'Company ID', example: '123' })
  companyId: string;

  @Expose()
  @ApiProperty({ description: 'Company name', example: 'TechCorp Inc.' })
  companyName: string;

  @Expose()
  @ApiProperty({ description: 'Total jobs posted by company', example: 25 })
  totalJobs: number;

  @Expose()
  @ApiProperty({ description: 'Total applications received', example: 456 })
  totalApplications: number;

  @Expose()
  @ApiProperty({ description: 'Total hires made', example: 12 })
  totalHires: number;

  @Expose()
  @ApiProperty({ description: 'Hire rate percentage', example: 2.6 })
  hireRate: number;

  @Expose()
  @ApiProperty({ description: 'Average time to hire (days)', example: 18.5 })
  avgTimeToHire: number;
}

/**
 * Geographic distribution DTO
 */
export class GeographicDistributionDto {
  @Expose()
  @ApiProperty({ description: 'Location/City', example: 'San Francisco' })
  location: string;

  @Expose()
  @ApiProperty({
    description: 'Number of companies in this location',
    example: 34,
  })
  count: number;

  @Expose()
  @ApiProperty({ description: 'Percentage of total companies', example: 13.6 })
  percentage: number;

  @Expose()
  @ApiProperty({
    description: 'Total job postings in this location',
    example: 178,
  })
  totalJobs: number;

  @Expose()
  @ApiProperty({
    description: 'Average salary in this location',
    example: 125000,
  })
  avgSalary: number;
}

/**
 * Company growth metrics DTO
 */
export class CompanyGrowthMetricsDto {
  @Expose()
  @ApiProperty({ description: 'Total companies registered', example: 250 })
  totalCompanies: number;

  @Expose()
  @ApiProperty({
    description: 'Active companies (posted jobs in last 30 days)',
    example: 185,
  })
  activeCompanies: number;

  @Expose()
  @ApiProperty({ description: 'New companies this month', example: 12 })
  newCompaniesThisMonth: number;

  @Expose()
  @ApiProperty({ description: 'Company growth rate percentage', example: 8.3 })
  growthRate: number;

  @Expose()
  @ApiProperty({
    description: 'Average company size (employees)',
    example: 127,
  })
  avgCompanySize: number;

  @Expose()
  @ApiProperty({
    description: 'Companies with verified business licenses',
    example: 198,
  })
  verifiedCompanies: number;
}

/**
 * Company analytics response DTO
 */
export class CompanyAnalyticsResponseDto {
  @Expose()
  @ApiProperty({
    type: [CompanyRegistrationTrendDto],
    description: 'Company registration trends over time',
  })
  @Type(() => CompanyRegistrationTrendDto)
  registrationTrends: CompanyRegistrationTrendDto[];

  @Expose()
  @ApiProperty({
    type: [CompanySizeDistributionDto],
    description: 'Distribution by company size',
  })
  @Type(() => CompanySizeDistributionDto)
  sizeDistribution: CompanySizeDistributionDto[];

  @Expose()
  @ApiProperty({
    type: [IndustryAnalysisDto],
    description: 'Analysis by industry sector',
  })
  @Type(() => IndustryAnalysisDto)
  industryAnalysis: IndustryAnalysisDto[];

  @Expose()
  @ApiProperty({
    type: [HiringActivityDto],
    description: 'Top companies by hiring activity',
  })
  @Type(() => HiringActivityDto)
  topHiringCompanies: HiringActivityDto[];

  @Expose()
  @ApiProperty({
    type: [GeographicDistributionDto],
    description: 'Geographic distribution of companies',
  })
  @Type(() => GeographicDistributionDto)
  geographicDistribution: GeographicDistributionDto[];

  @Expose()
  @ApiProperty({
    type: CompanyGrowthMetricsDto,
    description: 'Overall company growth metrics',
  })
  @Type(() => CompanyGrowthMetricsDto)
  growthMetrics: CompanyGrowthMetricsDto;
}
