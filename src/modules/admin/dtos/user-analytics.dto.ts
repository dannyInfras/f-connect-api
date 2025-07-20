import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

/**
 * User registration trend data point DTO
 */
export class RegistrationTrendDto {
  @Expose()
  @ApiProperty({
    description: 'Date for the data point',
    example: '2024-01-15',
  })
  date: string;

  @Expose()
  @ApiProperty({ description: 'Total registrations on this date', example: 25 })
  registrations: number;

  @Expose()
  @ApiProperty({ description: 'Local provider registrations', example: 18 })
  localRegistrations: number;

  @Expose()
  @ApiProperty({ description: 'Google OAuth registrations', example: 7 })
  googleRegistrations: number;
}

/**
 * Distribution data DTO for various user metrics
 */
export class DistributionDto {
  @Expose()
  @ApiProperty({ description: 'Category name', example: 'USER' })
  name: string;

  @Expose()
  @ApiProperty({ description: 'Count in this category', example: 850 })
  count: number;

  @Expose()
  @ApiProperty({ description: 'Percentage of total', example: 68.0 })
  percentage: number;
}

/**
 * User demographics DTO
 */
export class UserDemographicsDto {
  @Expose()
  @ApiProperty({
    type: [DistributionDto],
    description: 'User distribution by role',
  })
  @Type(() => DistributionDto)
  userByRoles: DistributionDto[];

  @Expose()
  @ApiProperty({
    type: [DistributionDto],
    description: 'User distribution by authentication provider',
  })
  @Type(() => DistributionDto)
  userByProvider: DistributionDto[];

  @Expose()
  @ApiProperty({
    type: [DistributionDto],
    description: 'User distribution by account status',
  })
  @Type(() => DistributionDto)
  userByAccountStatus: DistributionDto[];

  @Expose()
  @ApiProperty({
    type: [DistributionDto],
    description: 'User distribution by gender',
    required: false,
  })
  @Type(() => DistributionDto)
  userByGender?: DistributionDto[];
}

/**
 * User activity metrics DTO
 */
export class UserActivityMetricsDto {
  @Expose()
  @ApiProperty({
    description: 'Number of active users in the last 30 days',
    example: 756,
  })
  activeUsersLast30Days: number;

  @Expose()
  @ApiProperty({
    description: 'Account verification rate percentage',
    example: 85.2,
  })
  accountVerificationRate: number;

  @Expose()
  @ApiProperty({
    description: 'Average profile completion rate percentage',
    example: 72.8,
  })
  averageProfileCompletionRate: number;

  @Expose()
  @ApiProperty({
    description: 'Number of users with complete profiles',
    example: 612,
  })
  usersWithCompleteProfiles: number;

  @Expose()
  @ApiProperty({
    description: 'Number of users who applied for jobs in last 30 days',
    example: 423,
  })
  activeJobSeekers: number;
}

/**
 * User analytics response DTO
 */
export class UserAnalyticsResponseDto {
  @Expose()
  @ApiProperty({
    type: [RegistrationTrendDto],
    description: 'User registration trends over time',
  })
  @Type(() => RegistrationTrendDto)
  registrationTrends: RegistrationTrendDto[];

  @Expose()
  @ApiProperty({
    type: UserDemographicsDto,
    description: 'User demographic breakdowns',
  })
  @Type(() => UserDemographicsDto)
  demographics: UserDemographicsDto;

  @Expose()
  @ApiProperty({
    type: UserActivityMetricsDto,
    description: 'User activity and engagement metrics',
  })
  @Type(() => UserActivityMetricsDto)
  activityMetrics: UserActivityMetricsDto;
}
