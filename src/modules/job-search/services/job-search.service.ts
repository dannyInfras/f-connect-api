import { Injectable, UnauthorizedException } from '@nestjs/common';

import { UserAccessTokenClaims } from '@/modules/auth/dtos/auth-token-output.dto';
import { Action } from '@/shared/acl/action.constant';
import { AppLogger } from '@/shared/logger/logger.service';

import { JobSearchAclService } from '../acl/job-search-acl.service';
import { JobSearchDto } from '../dtos/job-search-input.dto';
import { JobSearchRepository } from '../repositories/job-search.repository';
import {
  GetJobSuggestionsServiceParams,
  JobSearchServiceResponse,
  JobSuggestionsServiceResponse,
  JobWithApplicationStats,
  SearchJobsServiceParams,
} from '../types';
import { performanceMonitor } from '../utils/performance-monitor';
import { JobSearchCacheService } from './job-search-cache.service';

/**
 * Enhanced job search service with performance optimizations
 */
@Injectable()
export class JobSearchService {
  constructor(
    private readonly jobSearchRepository: JobSearchRepository,
    private readonly cacheService: JobSearchCacheService,
    private readonly aclService: JobSearchAclService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(JobSearchService.name);
  }

  /**
   * Search jobs with caching and performance optimizations
   */
  async searchJobs(
    params: SearchJobsServiceParams,
  ): Promise<JobSearchServiceResponse> {
    const { dto, user } = params;
    const operationId = `search_${Date.now()}`;

    // Start performance monitoring
    performanceMonitor.startTimer(operationId);

    // Check permissions
    if (!this.aclService.forActor(user).canDoAction(Action.Read, null)) {
      throw new UnauthorizedException('You are not authorized to search jobs');
    }

    try {
      // Track hot queries for analytics
      if (dto.q) {
        await this.cacheService.trackHotQuery(dto.q);
      }

      // Check cache first
      const cacheKey = this.cacheService.generateSearchKey({
        query: dto.q,
        location: dto.location,
        categoryIds: dto.categoryIds,
        companyIds: dto.companyIds,
        employmentTypes: dto.employmentTypes,
        salaryMin: dto.salaryMin,
        salaryMax: dto.salaryMax,
        minExperienceYears: dto.minExperienceYears,
        activeOnly: dto.activeOnly,
        sortBy: dto.sortBy,
        page: dto.page,
        limit: dto.limit,
      });

      const cachedResult = await this.cacheService.getSearchResults(cacheKey);
      if (cachedResult) {
        performanceMonitor.recordCacheHit(cacheKey, true);
        performanceMonitor.endTimer(operationId, { cached: true });
        return cachedResult;
      }

      performanceMonitor.recordCacheHit(cacheKey, false);

      const {
        q,
        location,
        categoryIds,
        companyIds,
        employmentTypes,
        salaryMin,
        salaryMax,
        minExperienceYears,
        activeOnly = true,
        sortBy,
        page = 1,
        limit = 10,
      } = dto;

      const searchResult = await this.jobSearchRepository.searchJobs({
        query: q,
        categoryIds: categoryIds?.map((id) => parseInt(id)),
        companyIds: companyIds?.map((id) => parseInt(id)),
        employmentTypes,
        jobLevels: [],
        salaryMin,
        salaryMax,
        minExperienceYears,
        location,
        activeOnly,
        sortBy: sortBy || 'relevance',
        limit,
        cursor: undefined,
        page,
      });

      // Map repository results to service response
      const mappedJobs: JobWithApplicationStats[] = searchResult.jobs.map(
        (job) => ({
          ...job,
          isCapacityReached: job.capacity
            ? job.totalApplications >= job.capacity
            : false,
        }),
      );

      // Filter jobs based on permissions
      const authorizedJobs = mappedJobs.filter((job) =>
        this.aclService.forActor(user).canDoAction(Action.Read, job),
      );

      const totalPages = Math.ceil(searchResult.totalCount / limit);

      const result: JobSearchServiceResponse = {
        data: authorizedJobs,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: searchResult.totalCount,
          itemsPerPage: limit,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
        filters: {
          appliedFilters: {
            query: q,
            location,
            categoryIds: categoryIds?.map((id) => parseInt(id)),
            companyIds: companyIds?.map((id) => parseInt(id)),
            employmentTypes,
            jobLevels: [],
            salaryRange:
              salaryMin || salaryMax
                ? { min: salaryMin, max: salaryMax }
                : undefined,
            minExperienceYears,
            activeOnly,
          },
          availableCategories: [],
          availableCompanies: [],
          availableEmploymentTypes: [],
          availableJobLevels: [],
        },
      };

      // Cache the result
      await this.cacheService.setSearchResults(cacheKey, result);

      // Record performance metrics
      performanceMonitor.recordQueryPattern({
        hasTextSearch: !!q,
        hasFilters: !!(categoryIds?.length || companyIds?.length || location),
        filterCount:
          (categoryIds?.length || 0) +
          (companyIds?.length || 0) +
          (location ? 1 : 0),
        resultCount: authorizedJobs.length,
      });

      const duration = performanceMonitor.endTimer(operationId, {
        cached: false,
      });

      // Log slow queries
      if (duration > 1000) {
        console.warn(`Slow search query detected: ${duration}ms`, {
          query: q,
          resultCount: authorizedJobs.length,
        });
      }

      return result;
    } catch (error) {
      performanceMonitor.endTimer(operationId, { error: true });
      throw error;
    }
  }

  /**
   * Get search suggestions with caching
   */
  async getJobSuggestions(
    params: GetJobSuggestionsServiceParams,
  ): Promise<JobSuggestionsServiceResponse> {
    const { query, user } = params;

    // Check permissions
    if (!this.aclService.forActor(user).canDoAction(Action.Read, null)) {
      throw new UnauthorizedException(
        'You are not authorized to get job suggestions',
      );
    }

    try {
      if (!query?.trim() || query.length < 2) {
        return { keywords: [], jobs: [], companies: [] };
      }

      // Check cache first
      const cacheKey = this.cacheService.generateSuggestionsKey(query, 3);
      const cachedSuggestions =
        await this.cacheService.getSuggestions(cacheKey);
      if (cachedSuggestions) {
        // For now, we'll disable caching for structured responses
        // TODO: Update cache service to handle structured data
      }

      const result = await this.jobSearchRepository.getJobSuggestions({
        query: query.trim(),
        limit: 3,
      });

      // TODO: Update caching to handle structured responses
      // await this.cacheService.setSuggestions(cacheKey, result);

      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Search jobs with permission checking (for controller use) - with caching
   */
  async searchJobsWithPermissions(params: {
    dto: JobSearchDto;
    user: UserAccessTokenClaims | undefined;
  }): Promise<any> {
    const { dto, user } = params;

    // Permission checking logic moved from controller
    if (!this.hasSearchPermission(user, dto)) {
      throw new UnauthorizedException(
        'Insufficient permissions to perform this search',
      );
    }

    return this.searchWithCursor(dto);
  }

  /**
   * Get job suggestions with permission checking (for controller use) - with caching
   */
  async getJobSuggestionsWithPermissions(params: {
    query: string;
    limit?: number;
    user: UserAccessTokenClaims | undefined;
  }): Promise<JobSuggestionsServiceResponse> {
    const { query, user } = params;

    // Basic search suggestions are available to all authenticated users
    if (!this.hasBasicSearchPermission(user, query)) {
      throw new UnauthorizedException(
        'Insufficient permissions for suggestions',
      );
    }

    try {
      if (!query?.trim() || query.length < 2) {
        return { keywords: [], jobs: [], companies: [] };
      }

      // Check cache first
      const cacheKey = this.cacheService.generateSuggestionsKey(query, 3);
      const cachedSuggestions =
        await this.cacheService.getSuggestions(cacheKey);
      if (cachedSuggestions) {
        // For now, we'll disable caching for structured responses
        // TODO: Update cache service to handle structured data
      }

      const result = await this.jobSearchRepository.getJobSuggestions({
        query: query.trim(),
        limit: 3,
      });

      // TODO: Update caching to handle structured responses
      // await this.cacheService.setSuggestions(cacheKey, result);

      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Legacy method with caching added
   */
  async searchWithCursor(searchDto: JobSearchDto): Promise<any> {
    const operationId = `cursor_search_${Date.now()}`;
    performanceMonitor.startTimer(operationId);

    try {
      // Check cache first
      const cacheKey = this.cacheService.generateSearchKey({
        query: searchDto.q,
        location: searchDto.location,
        categoryIds: searchDto.categoryIds,
        companyIds: searchDto.companyIds,
        employmentTypes: searchDto.employmentTypes,
        salaryMin: searchDto.salaryMin,
        salaryMax: searchDto.salaryMax,
        minExperienceYears: searchDto.minExperienceYears,
        activeOnly: searchDto.activeOnly,
        sortBy: searchDto.sortBy,
        page: searchDto.page,
        limit: searchDto.limit,
      });

      const cachedResult = await this.cacheService.getSearchResults(cacheKey);
      if (cachedResult) {
        performanceMonitor.recordCacheHit(cacheKey, true);
        performanceMonitor.endTimer(operationId, { cached: true });
        return cachedResult;
      }

      performanceMonitor.recordCacheHit(cacheKey, false);

      const searchResult = await this.jobSearchRepository.searchJobs({
        query: searchDto.q,
        categoryIds: searchDto.categoryIds?.map((id) => parseInt(id)),
        companyIds: searchDto.companyIds?.map((id) => parseInt(id)),
        employmentTypes: searchDto.employmentTypes,
        jobLevels: [],
        salaryMin: searchDto.salaryMin,
        salaryMax: searchDto.salaryMax,
        minExperienceYears: searchDto.minExperienceYears,
        location: searchDto.location,
        activeOnly: searchDto.activeOnly,
        sortBy: searchDto.sortBy || 'relevance',
        limit: searchDto.limit || 10,
        cursor: undefined,
        page: searchDto.page,
      });

      const totalPages = Math.ceil(
        searchResult.totalCount / (searchDto.limit || 10),
      );

      const result = {
        data: searchResult.jobs,
        pagination: {
          currentPage: searchDto.page || 1,
          totalPages,
          totalItems: searchResult.totalCount,
          itemsPerPage: searchDto.limit || 10,
          hasNextPage: (searchDto.page || 1) < totalPages,
          hasPreviousPage: (searchDto.page || 1) > 1,
        },
        filters: {
          appliedFilters: {
            query: searchDto.q,
            location: searchDto.location,
            categoryIds: searchDto.categoryIds?.map((id) => parseInt(id)),
            companyIds: searchDto.companyIds?.map((id) => parseInt(id)),
            employmentTypes: searchDto.employmentTypes,
            activeOnly: searchDto.activeOnly,
          },
        },
      };

      // Cache the result
      await this.cacheService.setSearchResults(cacheKey, result);

      const duration = performanceMonitor.endTimer(operationId, {
        cached: false,
      });

      // Log slow queries
      if (duration > 1000) {
        console.warn(`Slow cursor search: ${duration}ms`, {
          query: searchDto.q,
          page: searchDto.page,
        });
      }

      return result;
    } catch (error) {
      performanceMonitor.endTimer(operationId, { error: true });
      throw error;
    }
  }

  /**
   * Get performance stats
   */
  async getPerformanceStats() {
    const cacheStats = await this.cacheService.getCacheStats();
    const performanceStats = performanceMonitor.getPerformanceSummary();

    return {
      cache: cacheStats,
      performance: performanceStats,
      popularPatterns: performanceMonitor.getPopularPatterns(),
    };
  }

  /**
   * Check if user has permission to perform search (moved from controller)
   */
  private hasSearchPermission(
    user: UserAccessTokenClaims | undefined,
    searchDto: JobSearchDto,
  ): boolean {
    // If no user context (unauthenticated), allow basic searches only
    if (!user) {
      // Allow basic searches without sensitive filters
      return !searchDto.companyIds?.length;
    }

    // Check ACL permissions for authenticated users
    return this.aclService.forActor(user).canDoAction(Action.Read, searchDto);
  }

  /**
   * Check if user has permission for basic searches like suggestions
   */
  private hasBasicSearchPermission(
    user: UserAccessTokenClaims | undefined,
    query: string,
  ): boolean {
    // Basic search suggestions are available to all users
    if (!user) {
      return !!(query && query.length >= 2);
    }

    // Authenticated users can always get suggestions
    return this.aclService.forActor(user).canDoAction(Action.Read, null);
  }
}
