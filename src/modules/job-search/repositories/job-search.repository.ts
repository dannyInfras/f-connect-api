import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';

import { JobApplication } from '@/modules/applications/entities/job-application.entity';
import { Job } from '@/modules/jobs/entities/jobs.entity';

import { JobSearchSortBy } from '../enums';
import {
  JobSearchJobResult,
  JobSearchQueryParams,
  JobSearchResult,
  JobSearchSuggestionsParams,
  JobSearchSuggestionsResult,
} from '../types';

@Injectable()
export class JobSearchRepository {
  private readonly logger = new Logger(JobSearchRepository.name);

  constructor(
    @InjectRepository(Job)
    private readonly jobRepo: Repository<Job>,
    @InjectRepository(JobApplication)
    private readonly applicationRepo: Repository<JobApplication>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Search jobs with comprehensive filtering and pagination
   */
  async searchJobs(params: JobSearchQueryParams): Promise<JobSearchResult> {
    const {
      query,
      categoryIds,
      companyIds,
      employmentTypes,
      jobLevels,
      salaryMin,
      salaryMax,
      minExperienceYears,
      location,
      activeOnly,
      sortBy,
      cursor,
      page,
      limit,
    } = params;

    let queryBuilder = this.jobRepo
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.company', 'company')
      .leftJoinAndSelect('job.category', 'category')
      .leftJoin('job_application', 'application', 'application.job_id = job.id')
      .addSelect('COUNT(application.id)', 'totalApplications')
      .groupBy('job.id, company.id, category.id');

    // Apply filters
    queryBuilder = this.applyFilters(queryBuilder, {
      query,
      categoryIds,
      companyIds,
      employmentTypes,
      jobLevels,
      salaryMin,
      salaryMax,
      minExperienceYears,
      location,
      activeOnly,
    });

    // Apply sorting
    queryBuilder = this.applySorting(queryBuilder, sortBy, query);

    // Apply pagination - prioritize cursor over page-based pagination
    if (cursor) {
      // Apply cursor pagination
      queryBuilder = this.applyCursor(queryBuilder, cursor, sortBy);
      // Apply limit with +1 to check for next page
      queryBuilder = queryBuilder.limit(limit + 1);
    } else if (page && page > 1) {
      // Apply page-based pagination with OFFSET/LIMIT
      const offset = (page - 1) * limit;
      queryBuilder = queryBuilder.offset(offset).limit(limit);
    } else {
      // First page or no pagination specified
      queryBuilder = queryBuilder.limit(limit);
    }

    const results = await queryBuilder.getRawAndEntities();

    // Handle pagination results
    let jobs: Job[];
    let hasNextPage: boolean;

    if (cursor) {
      // Cursor-based pagination logic
      jobs = results.entities.slice(0, limit);
      hasNextPage = results.entities.length > limit;
    } else {
      // Page-based pagination logic
      jobs = results.entities;
      // For page-based pagination, we need to check if there are more results
      // by counting total results or checking if we got a full page
      hasNextPage = jobs.length === limit;

      // More accurate hasNextPage check: query one more record
      if (hasNextPage && page) {
        const nextPageCheck = await this.createBaseQuery(params)
          .offset(page * limit)
          .limit(1)
          .getCount();
        hasNextPage = nextPageCheck > 0;
      }
    }

    // Map results
    const mappedJobs: JobSearchJobResult[] = jobs.map((job, index) => {
      const raw = results.raw[index];
      return this.mapToJobSearchJobResult(job, raw);
    });

    // Generate next cursor (only for cursor-based pagination)
    const nextCursor =
      cursor && hasNextPage && jobs.length > 0
        ? this.generateCursor(jobs[jobs.length - 1], sortBy)
        : undefined;

    // Get total count (approximate for performance)
    const totalCount = await this.getTotalCount(params);

    return {
      jobs: mappedJobs,
      hasNextPage,
      nextCursor,
      totalCount,
    };
  }

  /**
   * Create base query builder with filters and sorting for reuse
   */
  private createBaseQuery(params: JobSearchQueryParams): any {
    const {
      query,
      categoryIds,
      companyIds,
      employmentTypes,
      jobLevels,
      salaryMin,
      salaryMax,
      minExperienceYears,
      location,
      activeOnly,
      sortBy,
    } = params;

    let queryBuilder = this.jobRepo
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.company', 'company')
      .leftJoinAndSelect('job.category', 'category');

    // Apply filters
    queryBuilder = this.applyFilters(queryBuilder, {
      query,
      categoryIds,
      companyIds,
      employmentTypes,
      jobLevels,
      salaryMin,
      salaryMax,
      minExperienceYears,
      location,
      activeOnly,
    });

    // Apply sorting
    queryBuilder = this.applySorting(queryBuilder, sortBy, query);

    return queryBuilder;
  }

  /**
   * Get job search suggestions for autocomplete
   */
  async getJobSuggestions(
    params: JobSearchSuggestionsParams,
  ): Promise<JobSearchSuggestionsResult> {
    const { query, limit } = params;

    if (!query || query.trim().length < 2) {
      return { suggestions: [] };
    }

    const suggestions = await this.jobRepo
      .createQueryBuilder('job')
      .select('DISTINCT job.title', 'title')
      .where('job.title ILIKE :query', { query: `%${query}%` })
      .andWhere('job.status = :status', { status: 'OPEN' })
      .orderBy('job.title')
      .limit(limit)
      .getRawMany();

    return {
      suggestions: suggestions.map((s) => s.title),
    };
  }

  /**
   * Apply filters to the query builder
   */
  private applyFilters(
    queryBuilder: SelectQueryBuilder<Job>,
    filters: Omit<JobSearchQueryParams, 'sortBy' | 'cursor' | 'limit'>,
  ): SelectQueryBuilder<Job> {
    const {
      query,
      categoryIds,
      companyIds,
      employmentTypes,
      jobLevels,
      salaryMin,
      salaryMax,
      minExperienceYears,
      location,
      activeOnly,
    } = filters;

    // Full-text search
    if (query) {
      queryBuilder.andWhere('job.tsv @@ plainto_tsquery(:language, :query)', {
        language: 'english',
        query: query.trim(),
      });
    }

    // Category filter
    if (categoryIds && categoryIds.length > 0) {
      queryBuilder.andWhere('job.category_id IN (:...categoryIds)', {
        categoryIds,
      });
    }

    // Company filter
    if (companyIds && companyIds.length > 0) {
      queryBuilder.andWhere('job.company_id IN (:...companyIds)', {
        companyIds,
      });
    }

    // Employment type filter
    if (employmentTypes && employmentTypes.length > 0) {
      queryBuilder.andWhere('job.typeOfEmployment IN (:...employmentTypes)', {
        employmentTypes,
      });
    }

    // Job level filter
    if (jobLevels && jobLevels.length > 0) {
      queryBuilder.andWhere('job.job_level IN (:...jobLevels)', { jobLevels });
    }

    // Salary filters
    if (salaryMin !== undefined) {
      queryBuilder.andWhere('job.salary_min >= :salaryMin', { salaryMin });
    }
    if (salaryMax !== undefined) {
      queryBuilder.andWhere('job.salary_max <= :salaryMax', { salaryMax });
    }

    // Experience filter
    if (minExperienceYears !== undefined) {
      queryBuilder.andWhere('job.experience_years >= :minExp', {
        minExp: minExperienceYears,
      });
    }

    // Location filter
    if (location) {
      queryBuilder.andWhere('job.location ILIKE :location', {
        location: `%${location}%`,
      });
    }

    // Active jobs only
    if (activeOnly) {
      queryBuilder
        .andWhere('job.status = :status', { status: 'OPEN' })
        .andWhere('job.deadline >= :now', { now: new Date() });
    }

    return queryBuilder;
  }

  /**
   * Apply sorting to the query builder
   */
  private applySorting(
    queryBuilder: SelectQueryBuilder<Job>,
    sortBy: string,
    query?: string,
  ): SelectQueryBuilder<Job> {
    switch (sortBy) {
      case JobSearchSortBy.RELEVANCE:
        if (query) {
          queryBuilder.addSelect(
            'ts_rank_cd(job.tsv, plainto_tsquery(:language, :query))',
            'relevance_rank',
          );
          queryBuilder.orderBy('relevance_rank', 'DESC');
        } else {
          queryBuilder.orderBy('job.created_at', 'DESC');
        }
        break;

      case JobSearchSortBy.DATE_POSTED:
        queryBuilder.orderBy('job.created_at', 'DESC');
        break;

      case JobSearchSortBy.SALARY_HIGH_TO_LOW:
        queryBuilder.orderBy(
          'COALESCE(job.salary_max, job.salary_min, 0)',
          'DESC',
        );
        break;

      case JobSearchSortBy.SALARY_LOW_TO_HIGH:
        queryBuilder.orderBy(
          'COALESCE(job.salary_min, job.salary_max, 0)',
          'ASC',
        );
        break;

      case JobSearchSortBy.EXPERIENCE_REQUIRED:
        queryBuilder.orderBy('COALESCE(job.experience_years, 0)', 'ASC');
        break;

      default:
        queryBuilder.orderBy('job.created_at', 'DESC');
    }

    // Add secondary sort by ID for consistency
    queryBuilder.addOrderBy('job.id', 'DESC');

    return queryBuilder;
  }

  /**
   * Apply cursor pagination
   */
  private applyCursor(
    queryBuilder: SelectQueryBuilder<Job>,
    cursor: string,
    sortBy: string,
  ): SelectQueryBuilder<Job> {
    try {
      const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
      const { id, value } = JSON.parse(decoded);

      switch (sortBy) {
        case JobSearchSortBy.DATE_POSTED:
        case JobSearchSortBy.RELEVANCE:
          queryBuilder.andWhere(
            '(job.created_at < :cursorDate OR (job.created_at = :cursorDate AND job.id < :cursorId))',
            { cursorDate: value, cursorId: id },
          );
          break;

        case JobSearchSortBy.SALARY_HIGH_TO_LOW:
          queryBuilder.andWhere(
            '(COALESCE(job.salary_max, job.salary_min, 0) < :cursorSalary OR (COALESCE(job.salary_max, job.salary_min, 0) = :cursorSalary AND job.id < :cursorId))',
            { cursorSalary: value, cursorId: id },
          );
          break;

        case JobSearchSortBy.SALARY_LOW_TO_HIGH:
          queryBuilder.andWhere(
            '(COALESCE(job.salary_min, job.salary_max, 0) > :cursorSalary OR (COALESCE(job.salary_min, job.salary_max, 0) = :cursorSalary AND job.id < :cursorId))',
            { cursorSalary: value, cursorId: id },
          );
          break;

        case JobSearchSortBy.EXPERIENCE_REQUIRED:
          queryBuilder.andWhere(
            '(COALESCE(job.experience_years, 0) > :cursorExp OR (COALESCE(job.experience_years, 0) = :cursorExp AND job.id < :cursorId))',
            { cursorExp: value, cursorId: id },
          );
          break;
      }
    } catch (error) {
      this.logger.warn(`Invalid cursor format: ${cursor}`);
    }

    return queryBuilder;
  }

  /**
   * Generate cursor for pagination
   */
  private generateCursor(job: Job, sortBy: string): string {
    let value: any;

    switch (sortBy) {
      case JobSearchSortBy.DATE_POSTED:
      case JobSearchSortBy.RELEVANCE:
        value = job.createdAt;
        break;
      case JobSearchSortBy.SALARY_HIGH_TO_LOW:
      case JobSearchSortBy.SALARY_LOW_TO_HIGH:
        value = job.salaryMax || job.salaryMin || 0;
        break;
      case JobSearchSortBy.EXPERIENCE_REQUIRED:
        value = job.experienceYears || 0;
        break;
      default:
        value = job.createdAt;
    }

    const cursorData = { id: job.id, value };
    return Buffer.from(JSON.stringify(cursorData)).toString('base64');
  }

  /**
   * Get approximate total count for performance
   */
  private async getTotalCount(params: JobSearchQueryParams): Promise<number> {
    let queryBuilder = this.jobRepo.createQueryBuilder('job');

    queryBuilder = this.applyFilters(queryBuilder, params);

    return queryBuilder.getCount();
  }

  /**
   * Map Job entity to JobSearchJobResult
   */
  private mapToJobSearchJobResult(job: Job, raw: any): JobSearchJobResult {
    return {
      id: job.id,
      title: job.title,
      description: job.description,
      responsibility: job.responsibility.join(' '), // Convert array to string
      location: job.location,
      typeOfEmployment: job.typeOfEmployment,
      jobLevel: undefined, // Not available in current entity
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      minExperienceYears: job.experienceYears,
      deadline: job.deadline,
      isActive: job.status === 'OPEN',
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      company: {
        id: job.company.id,
        companyName: job.company.companyName,
        logoUrl: job.company.logoUrl,
      },
      category: {
        id: parseInt(job.category.id),
        name: job.category.name,
      },
      totalApplications: parseInt(raw.totalApplications) || 0,
      capacity: undefined, // Not available in current entity
      rank: raw.relevance_rank ? parseFloat(raw.relevance_rank) : undefined,
    };
  }
}
