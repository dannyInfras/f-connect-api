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

/**
 * Job search service with advanced filtering and full-text search capabilities
 */
@Injectable()
export class JobSearchService {
  constructor(
    private readonly jobSearchRepository: JobSearchRepository,
    private readonly aclService: JobSearchAclService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(JobSearchService.name);
  }

  /**
   * Search jobs with comprehensive filtering and pagination
   */
  async searchJobs(
    params: SearchJobsServiceParams,
  ): Promise<JobSearchServiceResponse> {
    const { dto, user } = params;

    // Check permissions
    if (!this.aclService.forActor(user).canDoAction(Action.Read, null)) {
      throw new UnauthorizedException('You are not authorized to search jobs');
    }

    try {
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
        jobLevels: [], // Add job levels when available in DTO
        salaryMin,
        salaryMax,
        minExperienceYears,
        location,
        activeOnly,
        sortBy: sortBy || 'relevance',
        limit,
        cursor: undefined,
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

      return {
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
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get search suggestions for autocomplete
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
        return { suggestions: [] };
      }

      const result = await this.jobSearchRepository.getJobSuggestions({
        query: query.trim(),
        limit: 10,
      });

      return {
        suggestions: result.suggestions,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Search jobs with permission checking (for controller use)
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
   * Get job suggestions with permission checking (for controller use)
   */
  async getJobSuggestionsWithPermissions(params: {
    query: string;
    user: UserAccessTokenClaims | undefined;
  }): Promise<JobSuggestionsServiceResponse> {
    const { query, user } = params;

    // Basic search suggestions are available to all authenticated users
    // and even unauthenticated users for basic queries
    if (!this.hasBasicSearchPermission(user, query)) {
      throw new UnauthorizedException(
        'Insufficient permissions for suggestions',
      );
    }

    try {
      if (!query?.trim() || query.length < 2) {
        return { suggestions: [] };
      }

      const result = await this.jobSearchRepository.getJobSuggestions({
        query: query.trim(),
        limit: 10,
      });

      return {
        suggestions: result.suggestions,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Legacy method for backward compatibility
   * @deprecated Use searchJobs instead
   */
  async searchWithCursor(searchDto: JobSearchDto): Promise<any> {
    // Simple implementation for backward compatibility
    try {
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
      });

      const totalPages = Math.ceil(
        searchResult.totalCount / (searchDto.limit || 10),
      );

      return {
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
    } catch (error) {
      throw error;
    }
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
    // including unauthenticated users for simple queries
    if (!user) {
      return !!(query && query.length >= 2); // Minimum query length for unauthenticated
    }

    // Authenticated users can always get suggestions
    return this.aclService.forActor(user).canDoAction(Action.Read, null);
  }
}
