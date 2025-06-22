import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

import { EmploymentType, JobSearchSortBy } from '../enums';

/**
 * Job search request DTO with comprehensive filtering options
 */
export class JobSearchDto {
  /**
   * Search query for full-text search on job title, description, and responsibilities
   * @example "Senior React Developer"
   */
  @ApiPropertyOptional({
    description: 'Search query for full-text search',
    example: 'Senior React Developer',
  })
  @IsOptional()
  @IsString()
  q?: string;

  /**
   * Location filter for job search
   * @example "New York, NY"
   */
  @IsOptional()
  @IsString()
  location?: string;

  /**
   * Array of category IDs to filter by
   * @example ["1", "2", "3"]
   */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((item) => item.trim());
    }
    return value;
  })
  categoryIds?: string[];

  /**
   * Array of company IDs to filter by
   * @example ["1", "2", "3"]
   */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((item) => item.trim());
    }
    return value;
  })
  companyIds?: string[];

  /**
   * Array of employment types to filter by
   * @example ["FullTime", "Remote"]
   */
  @IsOptional()
  @IsArray()
  @IsEnum(EmploymentType, { each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((item) => item.trim());
    }
    return value;
  })
  employmentTypes?: EmploymentType[];

  /**
   * Minimum salary filter
   * @example 50000
   */
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  salaryMin?: number;

  /**
   * Maximum salary filter
   * @example 150000
   */
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  salaryMax?: number;

  /**
   * Minimum years of experience required
   * @example 3
   */
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(50)
  @Type(() => Number)
  minExperienceYears?: number;

  /**
   * Filter to show only active jobs (within deadline)
   * @example true
   */
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return value;
  })
  activeOnly?: boolean = true;

  /**
   * Sort order for search results
   * @example "relevance"
   */
  @IsOptional()
  @IsEnum(JobSearchSortBy)
  sortBy?: JobSearchSortBy = JobSearchSortBy.RELEVANCE;

  /**
   * Page number for pagination (starts from 1)
   * @example 1
   */
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  /**
   * Number of items per page
   * @example 10
   */
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 10;
}
