import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

import { ApplicationStatus } from '@/modules/applications/enums/application-status.enum';

/**
 * Application trend data point DTO
 */
export class ApplicationTrendDto {
  @Expose()
  @ApiProperty({
    description: 'Date for the data point',
    example: '2024-01-15',
  })
  date: string;

  @Expose()
  @ApiProperty({ description: 'Total applications submitted', example: 45 })
  applications: number;

  @Expose()
  @ApiProperty({
    description: 'Applications that resulted in hire',
    example: 8,
  })
  hired: number;

  @Expose()
  @ApiProperty({ description: 'Applications that were rejected', example: 12 })
  rejected: number;

  @Expose()
  @ApiProperty({ description: 'Applications that got interview', example: 15 })
  interview: number;

  @Expose()
  @ApiProperty({
    description: 'Applications still in applied status',
    example: 10,
  })
  applied: number;
}

/**
 * Status distribution DTO
 */
export class StatusDistributionDto {
  @Expose()
  @ApiProperty({
    description: 'Application status',
    enum: ApplicationStatus,
    example: 'APPLIED',
  })
  status: ApplicationStatus;

  @Expose()
  @ApiProperty({
    description: 'Number of applications with this status',
    example: 156,
  })
  count: number;

  @Expose()
  @ApiProperty({
    description: 'Percentage of total applications',
    example: 42.3,
  })
  percentage: number;

  @Expose()
  @ApiProperty({
    description: 'Average time in this status (days)',
    example: 5.2,
  })
  avgTimeInStatus: number;
}

/**
 * Conversion rates DTO
 */
export class ConversionRatesDto {
  @Expose()
  @ApiProperty({
    description: 'Application to interview conversion rate',
    example: 35.8,
  })
  applicationToInterview: number;

  @Expose()
  @ApiProperty({
    description: 'Interview to hire conversion rate',
    example: 62.1,
  })
  interviewToHire: number;

  @Expose()
  @ApiProperty({
    description: 'Overall hire rate from applications',
    example: 22.2,
  })
  overallHireRate: number;

  @Expose()
  @ApiProperty({ description: 'Application rejection rate', example: 45.7 })
  rejectionRate: number;
}

/**
 * AI score distribution DTO
 */
export class AiScoreDistributionDto {
  @Expose()
  @ApiProperty({ description: 'Score range', example: '80-100' })
  range: string;

  @Expose()
  @ApiProperty({
    description: 'Number of applications in this range',
    example: 25,
  })
  count: number;

  @Expose()
  @ApiProperty({
    description: 'Percentage of scored applications',
    example: 18.5,
  })
  percentage: number;
}

/**
 * AI processing status DTO
 */
export class AiProcessingStatusDto {
  @Expose()
  @ApiProperty({ description: 'Number of completed AI analyses', example: 245 })
  completed: number;

  @Expose()
  @ApiProperty({ description: 'Number of pending AI analyses', example: 23 })
  pending: number;

  @Expose()
  @ApiProperty({ description: 'Number of failed AI analyses', example: 7 })
  failed: number;

  @Expose()
  @ApiProperty({ description: 'AI processing success rate', example: 89.1 })
  successRate: number;
}

/**
 * AI analysis insights DTO
 */
export class AiAnalysisInsightsDto {
  @Expose()
  @ApiProperty({
    description: 'Average AI score across all applications',
    example: 72.3,
  })
  averageAiScore: number;

  @Expose()
  @ApiProperty({ description: 'Median AI score', example: 75.0 })
  medianAiScore: number;

  @Expose()
  @ApiProperty({
    type: [AiScoreDistributionDto],
    description: 'AI score distribution by ranges',
  })
  @Type(() => AiScoreDistributionDto)
  scoreDistribution: AiScoreDistributionDto[];

  @Expose()
  @ApiProperty({
    type: AiProcessingStatusDto,
    description: 'AI processing status breakdown',
  })
  @Type(() => AiProcessingStatusDto)
  processingStatus: AiProcessingStatusDto;

  @Expose()
  @ApiProperty({
    description: 'Correlation between AI score and hire rate',
    example: 0.73,
  })
  scoreHireCorrelation: number;
}

/**
 * Time metrics DTO
 */
export class TimeMetricsDto {
  @Expose()
  @ApiProperty({
    description: 'Average time to first response (days)',
    example: 3.2,
  })
  averageTimeToResponse: number;

  @Expose()
  @ApiProperty({
    description: 'Average time from application to hire (days)',
    example: 18.7,
  })
  averageTimeToHire: number;

  @Expose()
  @ApiProperty({
    description: 'Average time from application to rejection (days)',
    example: 8.4,
  })
  averageTimeToRejection: number;

  @Expose()
  @ApiProperty({
    description: 'Average time from interview to decision (days)',
    example: 4.1,
  })
  averageTimeToDecision: number;
}

/**
 * Top performing jobs DTO
 */
export class TopPerformingJobDto {
  @Expose()
  @ApiProperty({ description: 'Job ID', example: '123' })
  jobId: string;

  @Expose()
  @ApiProperty({
    description: 'Job title',
    example: 'Senior Full Stack Developer',
  })
  jobTitle: string;

  @Expose()
  @ApiProperty({ description: 'Company name', example: 'TechCorp Inc.' })
  companyName: string;

  @Expose()
  @ApiProperty({ description: 'Total applications received', example: 78 })
  totalApplications: number;

  @Expose()
  @ApiProperty({ description: 'Number of hires made', example: 12 })
  hires: number;

  @Expose()
  @ApiProperty({ description: 'Hire rate percentage', example: 15.4 })
  hireRate: number;

  @Expose()
  @ApiProperty({
    description: 'Average AI score for applications',
    example: 81.2,
  })
  avgAiScore: number;
}

/**
 * Application analytics response DTO
 */
export class ApplicationAnalyticsResponseDto {
  @Expose()
  @ApiProperty({
    type: [ApplicationTrendDto],
    description: 'Application trends over time',
  })
  @Type(() => ApplicationTrendDto)
  applicationTrends: ApplicationTrendDto[];

  @Expose()
  @ApiProperty({
    type: [StatusDistributionDto],
    description: 'Distribution of applications by status',
  })
  @Type(() => StatusDistributionDto)
  statusDistribution: StatusDistributionDto[];

  @Expose()
  @ApiProperty({
    type: ConversionRatesDto,
    description: 'Application conversion rates and metrics',
  })
  @Type(() => ConversionRatesDto)
  conversionRates: ConversionRatesDto;

  @Expose()
  @ApiProperty({
    type: AiAnalysisInsightsDto,
    description: 'AI analysis insights and statistics',
  })
  @Type(() => AiAnalysisInsightsDto)
  aiAnalysisInsights: AiAnalysisInsightsDto;

  @Expose()
  @ApiProperty({
    type: TimeMetricsDto,
    description: 'Time-based metrics for application processing',
  })
  @Type(() => TimeMetricsDto)
  timeMetrics: TimeMetricsDto;

  @Expose()
  @ApiProperty({
    type: [TopPerformingJobDto],
    description: 'Top performing jobs by application metrics',
  })
  @Type(() => TopPerformingJobDto)
  topPerformingJobs: TopPerformingJobDto[];
}
