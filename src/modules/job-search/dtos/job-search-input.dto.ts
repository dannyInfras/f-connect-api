import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import { EmploymentType, JobSearchSortBy } from '../enums';

/**
 * Sanitize and normalize search query
 */
const sanitizeQuery = (value: string): string => {
  if (!value) return '';
  return value
    .trim()
    .replace(/[<>'"&]/g, '') // Remove potentially harmful characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .substring(0, 100); // Limit length for performance
};

/**
 * Enhanced job search request DTO with strict validation and sanitization
 */
export class JobSearchDto {
  /**
   * Search query for full-text search on job title, description, responsibilities, and company name
   * @example "Senior React Developer" or "Vinamilk"
   */
  @ApiPropertyOptional({
    description:
      'Search query for full-text search on job titles, descriptions, and company names (max 100 characters)',
    example: 'Senior React Developer',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Search query must not exceed 100 characters' })
  @Transform(({ value }) => sanitizeQuery(value))
  q?: string;

  /**
   * Location filter for job search
   * @example "New York, NY"
   */
  @ApiPropertyOptional({
    description: 'Location filter (max 50 characters)',
    example: 'New York, NY',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'Location must not exceed 50 characters' })
  @Transform(({ value }) => value?.trim()?.substring(0, 50))
  location?: string;

  /**
   * Array of category IDs to filter by (max 10 categories)
   * @example ["1", "2", "3"]
   */
  @ApiPropertyOptional({
    description: 'Category IDs filter (max 10 categories)',
    example: ['1', '2', '3'],
    maxItems: 10,
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10, {
    message: 'Maximum 10 categories allowed for performance',
  })
  @IsString({ each: true })
  @Matches(/^\d+$/, { each: true, message: 'Category IDs must be numeric' })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((item) => item.trim())
        .slice(0, 10);
    }
    return Array.isArray(value) ? value.slice(0, 10) : value;
  })
  categoryIds?: string[];

  /**
   * Array of company IDs to filter by (max 5 companies)
   * @example ["1", "2", "3"]
   */
  @ApiPropertyOptional({
    description: 'Company IDs filter (max 5 companies)',
    example: ['1', '2', '3'],
    maxItems: 5,
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5, { message: 'Maximum 5 companies allowed for performance' })
  @IsString({ each: true })
  @Matches(/^\d+$/, { each: true, message: 'Company IDs must be numeric' })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((item) => item.trim())
        .slice(0, 5);
    }
    return Array.isArray(value) ? value.slice(0, 5) : value;
  })
  companyIds?: string[];

  /**
   * Array of employment types to filter by (max 5 types)
   * @example ["FullTime", "Remote"]
   */
  @ApiPropertyOptional({
    description: 'Employment types filter (max 5 types)',
    example: ['FullTime', 'Remote'],
    enum: EmploymentType,
    isArray: true,
    maxItems: 5,
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5, { message: 'Maximum 5 employment types allowed' })
  @IsEnum(EmploymentType, { each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((item) => item.trim())
        .slice(0, 5);
    }
    return Array.isArray(value) ? value.slice(0, 5) : value;
  })
  employmentTypes?: EmploymentType[];

  /**
   * Minimum salary filter (0 to 10,000,000)
   * @example 50000
   */
  @ApiPropertyOptional({
    description: 'Minimum salary filter',
    example: 50000,
    minimum: 0,
    maximum: 10000000,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Minimum salary must be a valid number' })
  @Min(0, { message: 'Minimum salary cannot be negative' })
  @Max(10000000, { message: 'Minimum salary cannot exceed 10,000,000' })
  @Type(() => Number)
  salaryMin?: number;

  /**
   * Maximum salary filter (0 to 10,000,000)
   * @example 150000
   */
  @ApiPropertyOptional({
    description: 'Maximum salary filter',
    example: 150000,
    minimum: 0,
    maximum: 10000000,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Maximum salary must be a valid number' })
  @Min(0, { message: 'Maximum salary cannot be negative' })
  @Max(10000000, { message: 'Maximum salary cannot exceed 10,000,000' })
  @Type(() => Number)
  salaryMax?: number;

  /**
   * Minimum years of experience required (0 to 50)
   * @example 3
   */
  @ApiPropertyOptional({
    description: 'Minimum experience years (0-50)',
    example: 3,
    minimum: 0,
    maximum: 50,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Experience years must be a valid number' })
  @Min(0, { message: 'Experience years cannot be negative' })
  @Max(50, { message: 'Experience years cannot exceed 50' })
  @Type(() => Number)
  minExperienceYears?: number;

  /**
   * Filter to show only active jobs (within deadline)
   * @example true
   */
  @ApiPropertyOptional({
    description: 'Show only active jobs',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'activeOnly must be a boolean value' })
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
  @ApiPropertyOptional({
    description: 'Sort order for results',
    example: 'relevance',
    enum: JobSearchSortBy,
    default: JobSearchSortBy.RELEVANCE,
  })
  @IsOptional()
  @IsEnum(JobSearchSortBy, {
    message: `Sort by must be one of: ${Object.values(JobSearchSortBy).join(', ')}`,
  })
  sortBy?: JobSearchSortBy = JobSearchSortBy.RELEVANCE;

  /**
   * Page number for pagination (1 to 1000)
   * @example 1
   */
  @ApiPropertyOptional({
    description: 'Page number (1-1000)',
    example: 1,
    minimum: 1,
    maximum: 1000,
    default: 1,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Page must be a valid number' })
  @Min(1, { message: 'Page must be at least 1' })
  @Max(1000, { message: 'Page cannot exceed 1000 for performance reasons' })
  @Type(() => Number)
  page?: number = 1;

  /**
   * Number of items per page (1 to 50, optimized limit)
   * @example 10
   */
  @ApiPropertyOptional({
    description: 'Items per page (1-50, reduced for performance)',
    example: 10,
    minimum: 1,
    maximum: 50,
    default: 10,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Limit must be a valid number' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(50, { message: 'Limit cannot exceed 50 for performance optimization' })
  @Type(() => Number)
  limit?: number = 10;
}
