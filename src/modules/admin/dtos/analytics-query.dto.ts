import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional } from 'class-validator';

/**
 * DTO for analytics query parameters
 */
export class AnalyticsQueryDto {
  @ApiPropertyOptional({
    description: 'Start date for analytics data (ISO string)',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for analytics data (ISO string)',
    example: '2024-12-31T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Data aggregation interval',
    enum: ['daily', 'weekly', 'monthly'],
    example: 'monthly',
  })
  @IsOptional()
  @IsEnum(['daily', 'weekly', 'monthly'])
  interval?: 'daily' | 'weekly' | 'monthly';
}
