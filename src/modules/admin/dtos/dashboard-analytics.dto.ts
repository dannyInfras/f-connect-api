import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

/**
 * Dashboard key metrics DTO
 */
export class DashboardMetricsDto {
  @Expose()
  @ApiProperty({
    description: 'Total number of users in the system',
    example: 1250,
  })
  totalUsers: number;

  @Expose()
  @ApiProperty({
    description: 'Total number of active job postings',
    example: 85,
  })
  totalActiveJobs: number;

  @Expose()
  @ApiProperty({
    description: 'Total number of job applications',
    example: 3420,
  })
  totalApplications: number;

  @Expose()
  @ApiProperty({ description: 'Total number of companies', example: 245 })
  totalCompanies: number;

  @Expose()
  @ApiProperty({
    description: 'User growth rate percentage vs previous period',
    example: 12.5,
  })
  userGrowthRate: number;

  @Expose()
  @ApiProperty({
    description: 'Job growth rate percentage vs previous period',
    example: 8.3,
  })
  jobGrowthRate: number;

  @Expose()
  @ApiProperty({
    description: 'Application growth rate percentage vs previous period',
    example: 15.7,
  })
  applicationGrowthRate: number;

  @Expose()
  @ApiProperty({
    description: 'Company growth rate percentage vs previous period',
    example: 6.2,
  })
  companyGrowthRate: number;
}

/**
 * Recent activity item DTO
 */
export class RecentActivityDto {
  @Expose()
  @ApiProperty({ description: 'Activity ID', example: '123' })
  id: string;

  @Expose()
  @ApiProperty({ description: 'Activity type', example: 'user_registration' })
  type: string;

  @Expose()
  @ApiProperty({
    description: 'Activity description',
    example: 'New user registered: john@example.com',
  })
  description: string;

  @Expose()
  @ApiProperty({
    description: 'Activity timestamp',
    example: '2024-01-15T10:30:00.000Z',
  })
  timestamp: Date;

  @Expose()
  @ApiProperty({
    description: 'Associated user ID',
    example: 456,
    required: false,
  })
  userId?: number;

  @Expose()
  @ApiProperty({
    description: 'Associated entity ID',
    example: 'job-789',
    required: false,
  })
  entityId?: string;
}

/**
 * Admin alert DTO
 */
export class AdminAlertDto {
  @Expose()
  @ApiProperty({ description: 'Alert ID', example: 'alert-001' })
  id: string;

  @Expose()
  @ApiProperty({
    description: 'Alert severity level',
    enum: ['low', 'medium', 'high', 'critical'],
    example: 'medium',
  })
  severity: 'low' | 'medium' | 'high' | 'critical';

  @Expose()
  @ApiProperty({
    description: 'Alert title',
    example: 'High Application Rejection Rate',
  })
  title: string;

  @Expose()
  @ApiProperty({
    description: 'Alert message',
    example: 'Application rejection rate has increased by 25% this week',
  })
  message: string;

  @Expose()
  @ApiProperty({
    description: 'Alert timestamp',
    example: '2024-01-15T09:00:00.000Z',
  })
  timestamp: Date;

  @Expose()
  @ApiProperty({
    description: 'Whether alert has been acknowledged',
    example: false,
  })
  acknowledged: boolean;
}

/**
 * Dashboard analytics response DTO
 */
export class DashboardAnalyticsResponseDto {
  @Expose()
  @ApiProperty({
    type: DashboardMetricsDto,
    description: 'Key dashboard metrics',
  })
  @Type(() => DashboardMetricsDto)
  dashboardMetrics: DashboardMetricsDto;

  @Expose()
  @ApiProperty({
    type: [RecentActivityDto],
    description: 'Recent system activity',
  })
  @Type(() => RecentActivityDto)
  recentActivity: RecentActivityDto[];

  @Expose()
  @ApiProperty({
    type: [AdminAlertDto],
    description: 'System alerts requiring attention',
  })
  @Type(() => AdminAlertDto)
  alerts: AdminAlertDto[];
}
