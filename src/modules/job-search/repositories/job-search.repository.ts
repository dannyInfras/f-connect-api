import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';

import { JobApplication } from '@/modules/applications/entities/job-application.entity';
import { Company } from '@/modules/company/entities/company.entity';
import { Job } from '@/modules/jobs/entities/jobs.entity';

import { JobSearchSortBy } from '../enums';
import {
  JobSearchJobResult,
  JobSearchQueryParams,
  JobSearchResult,
  JobSearchSuggestionsParams,
  JobSearchSuggestionsResult,
} from '../types';
import { performanceMonitor } from '../utils/performance-monitor';

@Injectable()
export class JobSearchRepository {
  private readonly logger = new Logger(JobSearchRepository.name);

  // Common synonyms for better search results
  private readonly SYNONYMS_MAP = new Map([
    ['dev', 'developer'],
    ['developer', 'dev'],
    ['js', 'javascript'],
    ['javascript', 'js'],
    ['ts', 'typescript'],
    ['typescript', 'ts'],
    ['fe', 'frontend'],
    ['frontend', 'fe'],
    ['be', 'backend'],
    ['backend', 'be'],
    ['fullstack', 'full-stack'],
    ['full-stack', 'fullstack'],
    ['react', 'reactjs'],
    ['reactjs', 'react'],
    ['node', 'nodejs'],
    ['nodejs', 'node'],
  ]);

  constructor(
    @InjectRepository(Job)
    private readonly jobRepo: Repository<Job>,
    @InjectRepository(JobApplication)
    private readonly applicationRepo: Repository<JobApplication>,
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
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
      limit,
      page,
    } = params;

    // Performance Optimization: Use simpler query without JOINs first
    let queryBuilder = this.jobRepo
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.company', 'company')
      .leftJoinAndSelect('job.category', 'category');

    // Always filter out deleted jobs
    queryBuilder = queryBuilder.andWhere('job.isDeleted = :isDeleted', {
      isDeleted: false,
    });

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
    queryBuilder = this.applySorting(queryBuilder, sortBy, query, false);

    // Apply pagination (either cursor-based or page-based)
    if (cursor) {
      queryBuilder = this.applyCursor(queryBuilder, cursor, sortBy);
      queryBuilder = queryBuilder.limit(limit + 1);
    } else if (page) {
      // Page-based pagination with proper offset calculation
      const offset = (page - 1) * limit;
      queryBuilder = queryBuilder.offset(offset).limit(limit);
    } else {
      // Default pagination
      queryBuilder = queryBuilder.limit(limit);
    }

    // Performance optimization: Add monitoring
    const startTime = Date.now();
    const jobs = await queryBuilder.getMany();
    const queryTime = Date.now() - startTime;

    performanceMonitor.recordMetric('searchJobs', queryTime, {
      params,
      resultCount: jobs.length,
    });

    // For cursor pagination, check if there's a next page
    const hasNextPage = cursor ? jobs.length > limit : false;
    const finalJobs = cursor ? jobs.slice(0, limit) : jobs;

    // Use efficient subquery approach for application counts
    const mappedJobs = await this.addApplicationCountsSubquery(finalJobs);

    // Generate next cursor (only for cursor pagination)
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
   * Get job search suggestions for autocomplete
   */
  async getJobSuggestions(
    params: JobSearchSuggestionsParams,
  ): Promise<JobSearchSuggestionsResult> {
    const { query } = params;

    if (!query || query.trim().length < 2) {
      return { keywords: [], jobs: [], companies: [] };
    }

    const trimmedQuery = query.trim();

    // Fetch keyword suggestions (job titles and company names)
    const jobTitleRows = await this.jobRepo
      .createQueryBuilder('job')
      .select('DISTINCT job.title', 'value')
      .where('job.title ILIKE :query', { query: `%${trimmedQuery}%` })
      .andWhere('job.status = :status', { status: 'OPEN' })
      .andWhere('job.isDeleted = :isDeleted', { isDeleted: false })
      .orderBy('job.title')
      .limit(3)
      .getRawMany();

    const companyNameRows = await this.companyRepo
      .createQueryBuilder('company')
      .select('DISTINCT company.companyName', 'value')
      .where('company.companyName ILIKE :query', {
        query: `%${trimmedQuery}%`,
      })
      .orderBy('company.companyName')
      .limit(3)
      .getRawMany();

    // Merge and de-duplicate keywords
    const keywordValues = [
      ...jobTitleRows.map((r: any) => r.value),
      ...companyNameRows.map((r: any) => r.value),
    ];

    const seen = new Set<string>();
    const keywords = [] as string[];
    for (const val of keywordValues) {
      const normalized = typeof val === 'string' ? val.trim() : val;
      if (!normalized) continue;
      if (!seen.has(normalized)) {
        seen.add(normalized);
        keywords.push(normalized);
      }
      if (keywords.length >= 3) break;
    }

    // Fetch related jobs with detailed info
    const jobRows = await this.jobRepo
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.company', 'company')
      .select([
        'job.id',
        'job.title',
        'job.location',
        'job.typeOfEmployment',
        'company.companyName',
        'company.logoUrl',
      ])
      .where('(job.title ILIKE :query OR company.companyName ILIKE :query)', {
        query: `%${trimmedQuery}%`,
      })
      .andWhere('job.status = :status', { status: 'OPEN' })
      .andWhere('job.isDeleted = :isDeleted', { isDeleted: false })
      .orderBy('job.created_at', 'DESC')
      .limit(5)
      .getMany();

    const jobs = jobRows.map((job: any) => ({
      id: job.id,
      title: job.title,
      companyName: job.company.companyName,
      companyLogo: job.company.logoUrl,
      location: job.location,
      typeOfEmployment: job.typeOfEmployment,
    }));

    // Fetch companies with detailed info
    const companyRows = await this.companyRepo
      .createQueryBuilder('company')
      .select([
        'company.id',
        'company.companyName',
        'company.logoUrl',
        'company.industry',
      ])
      .where('company.companyName ILIKE :query', {
        query: `%${trimmedQuery}%`,
      })
      .orderBy('company.companyName')
      .limit(2)
      .getMany();

    const companies = companyRows.map((company: any) => ({
      id: company.id,
      name: company.companyName,
      logoUrl: company.logoUrl,
      industry: company.industry,
    }));

    return {
      keywords,
      jobs,
      companies,
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

    // Enhanced full-text search with fuzzy matching and synonyms
    if (query) {
      const normalizedQuery = this.normalizeQuery(query);
      const synonyms = this.expandSynonyms(normalizedQuery);

      let searchCondition = 'job.tsv @@ plainto_tsquery(:language, :query)';
      const searchParams: any = {
        language: 'english',
        query: normalizedQuery,
      };

      // Note: Fuzzy matching with similarity() requires pg_trgm extension
      // searchCondition += ' OR similarity(job.title, :fuzzyQuery) > 0.3';
      // searchParams.fuzzyQuery = normalizedQuery;

      // Add exact title matching for better relevance
      searchCondition += ' OR job.title ILIKE :titleQuery';
      searchParams.titleQuery = `%${normalizedQuery}%`;

      // Add company name matching for better results when searching by company
      searchCondition += ' OR company.companyName ILIKE :companyQuery';
      searchParams.companyQuery = `%${normalizedQuery}%`;

      // Add synonym matching
      if (synonyms.length > 0) {
        const synonymTsQuery = synonyms
          .map((synonym, index) => {
            searchParams[`synonymQuery${index}`] = synonym;
            return `job.tsv @@ plainto_tsquery(:language, :synonymQuery${index})`;
          })
          .join(' OR ');
        searchCondition += ` OR ${synonymTsQuery}`;
      }

      queryBuilder.andWhere(`(${searchCondition})`, searchParams);
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
    usePagePagination: boolean = false,
  ): SelectQueryBuilder<Job> {
    // Always sort by priority position first
    queryBuilder.orderBy('job.priority_position', 'ASC');

    switch (sortBy) {
      case JobSearchSortBy.RELEVANCE:
        if (query) {
          if (usePagePagination) {
            // For page-based pagination, use the expression directly in ORDER BY
            queryBuilder.addOrderBy(
              'ts_rank_cd(job.tsv, plainto_tsquery(:language, :query))',
              'DESC',
            );
          } else {
            // For cursor-based pagination, use addSelect with alias
            queryBuilder.addSelect(
              'ts_rank_cd(job.tsv, plainto_tsquery(:language, :query))',
              'relevance_rank',
            );
            queryBuilder.addOrderBy('relevance_rank', 'DESC');
          }
        } else {
          queryBuilder.addOrderBy('job.created_at', 'DESC');
        }
        break;

      case JobSearchSortBy.DATE_POSTED:
        queryBuilder.addOrderBy('job.created_at', 'DESC');
        break;

      case JobSearchSortBy.SALARY_HIGH_TO_LOW:
        queryBuilder.addOrderBy(
          'COALESCE(job.salary_max, job.salary_min, 0)',
          'DESC',
        );
        break;

      case JobSearchSortBy.SALARY_LOW_TO_HIGH:
        queryBuilder.addOrderBy(
          'COALESCE(job.salary_min, job.salary_max, 0)',
          'ASC',
        );
        break;

      case JobSearchSortBy.EXPERIENCE_REQUIRED:
        queryBuilder.addOrderBy('COALESCE(job.experience_years, 0)', 'ASC');
        break;

      default:
        queryBuilder.addOrderBy('job.created_at', 'DESC');
        break;
    }

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
    let queryBuilder = this.jobRepo
      .createQueryBuilder('job')
      .leftJoin('job.company', 'company')
      .leftJoin('job.category', 'category');

    // Always filter out deleted jobs
    queryBuilder = queryBuilder.andWhere('job.isDeleted = :isDeleted', {
      isDeleted: false,
    });

    queryBuilder = this.applyFilters(queryBuilder, params);

    return queryBuilder.getCount();
  }

  /**
   * Normalize search query for better matching
   */
  private normalizeQuery(query: string): string {
    return query
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ');
  }

  /**
   * Expand query with synonyms for better results
   */
  private expandSynonyms(query: string): string[] {
    const words = query.split(' ');
    const synonyms: string[] = [];

    words.forEach((word) => {
      const synonym = this.SYNONYMS_MAP.get(word);
      if (synonym && synonym !== word) {
        synonyms.push(synonym);
      }
    });

    return synonyms;
  }

  /**
   * Use subquery to get application counts efficiently (Performance Optimization)
   */
  private async addApplicationCountsSubquery(
    jobs: Job[],
  ): Promise<JobSearchJobResult[]> {
    if (jobs.length === 0) {
      return [];
    }

    const jobIds = jobs.map((job) => job.id);

    // Single optimized subquery for all application counts
    const applicationCounts = await this.dataSource
      .getRepository(JobApplication)
      .createQueryBuilder('app')
      .select('app.job_id', 'jobId')
      .addSelect('COUNT(*)', 'count')
      .where('app.job_id = ANY(:jobIds)', { jobIds })
      .groupBy('app.job_id')
      .getRawMany();

    // Create lookup map for O(1) access
    const countMap = new Map<string, number>();
    applicationCounts.forEach(({ jobId, count }) => {
      countMap.set(jobId, parseInt(count, 10));
    });

    // Map jobs to result format
    return jobs.map((job) => ({
      id: job.id,
      title: job.title,
      description: job.description,
      location: job.location,
      typeOfEmployment: job.typeOfEmployment,
      jobLevel: undefined,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      minExperienceYears: job.experienceYears,
      deadline: job.deadline,
      isActive: job.status === 'OPEN',
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      priorityPosition: job.priorityPosition || 3,
      company: {
        id: job.company.id,
        companyName: job.company.companyName,
        logoUrl: job.company.logoUrl,
      },
      category: {
        id: parseInt(job.category.id, 10),
        name: job.category.name,
      },
      totalApplications: countMap.get(job.id) || 0,
      capacity: undefined,
      rank: undefined,
    }));
  }

  /**
   * Map Job entity to JobSearchJobResult
   */
  private mapToJobSearchJobResult(job: Job, raw: any): JobSearchJobResult {
    return {
      id: job.id,
      title: job.title,
      description: job.description,
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
      priorityPosition: job.priorityPosition || 3,
      company: {
        id: job.company.id,
        companyName: job.company.companyName,
        logoUrl: job.company.logoUrl,
      },
      category: {
        id: parseInt(job.category.id),
        name: job.category.name,
      },
      totalApplications: parseInt(raw?.totalApplications) || 0,
      capacity: undefined, // Not available in current entity
      rank: raw?.relevance_rank ? parseFloat(raw.relevance_rank) : undefined,
    };
  }
}
