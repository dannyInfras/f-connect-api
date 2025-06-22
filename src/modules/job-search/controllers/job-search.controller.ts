import { Controller, Get, Query, ValidationPipe } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

import { UserAccessTokenClaims } from '@/modules/auth/dtos/auth-token-output.dto';
import { ReqContext } from '@/shared/request-context/req-context.decorator';
import { RequestContext } from '@/shared/request-context/request-context.dto';

import { JobSearchDto } from '../dtos/job-search-input.dto';
import { JobSearchResponseDto } from '../dtos/job-search-output.dto';
import { JobSearchSuggestionsResponseDto } from '../dtos/job-search-suggestions-output.dto';
import { EmploymentType,JobSearchSortBy } from '../enums';
import { JobSearchService } from '../services/job-search.service';

/**
 * Controller for advanced job search functionality
 * Provides endpoints for searching jobs with full-text search and filtering
 */
@ApiTags('Job Search')
@Controller('job-search')
export class JobSearchController {
  constructor(private readonly jobSearchService: JobSearchService) {}

  /**
   * Advanced job search with full-text search and comprehensive filtering
   */
  @Get('search')
  @ApiOperation({
    summary: 'Search jobs with advanced filtering',
    description: `
      Perform advanced job search with full-text search capabilities and comprehensive filtering options.
      Supports search by job title, description, responsibilities, location, category, company, salary range, and more.
      Returns paginated results with application statistics and relevance scoring for text searches.
    `,
  })
  @ApiQuery({
    name: 'q',
    required: false,
    description: 'Search query for full-text search',
  })
  @ApiQuery({
    name: 'location',
    required: false,
    description: 'Location filter',
  })
  @ApiQuery({
    name: 'categoryIds',
    required: false,
    type: [String],
    description: 'Category IDs filter',
  })
  @ApiQuery({
    name: 'companyIds',
    required: false,
    type: [String],
    description: 'Company IDs filter',
  })
  @ApiQuery({
    name: 'employmentTypes',
    required: false,
    enum: EmploymentType,
    isArray: true,
    description: 'Employment types filter',
  })
  @ApiQuery({
    name: 'salaryMin',
    required: false,
    type: Number,
    description: 'Minimum salary filter',
  })
  @ApiQuery({
    name: 'salaryMax',
    required: false,
    type: Number,
    description: 'Maximum salary filter',
  })
  @ApiQuery({
    name: 'minExperienceYears',
    required: false,
    type: Number,
    description: 'Minimum experience years',
  })
  @ApiQuery({
    name: 'activeOnly',
    required: false,
    type: Boolean,
    description: 'Show only active jobs (default: true)',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: JobSearchSortBy,
    description: 'Sort order for results',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10, max: 100)',
  })
  @ApiResponse({
    status: 200,
    description: 'Job search results retrieved successfully',
    type: JobSearchResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid search parameters',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access',
  })
  async searchJobs(
    @Query(new ValidationPipe({ transform: true })) searchDto: JobSearchDto,
    @ReqContext() ctx: RequestContext,
  ): Promise<JobSearchResponseDto> {
    const user = ctx.user as UserAccessTokenClaims | undefined;

    return this.jobSearchService.searchJobsWithPermissions({
      dto: searchDto,
      user,
    });
  }

  /**
   * Get search suggestions for autocomplete functionality
   */
  @Get('suggestions')
  @ApiOperation({
    summary: 'Get search suggestions',
    description: `
      Get search suggestions for autocomplete functionality.
      Returns suggestions for job titles, company names, and locations based on the provided query.
      Minimum query length is 2 characters.
    `,
  })
  @ApiQuery({
    name: 'q',
    required: true,
    description: 'Search query for suggestions (minimum 2 characters)',
  })
  @ApiResponse({
    status: 200,
    description: 'Search suggestions retrieved successfully',
    type: JobSearchSuggestionsResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid query parameter',
  })
  async getSearchSuggestions(
    @Query('q') query: string,
    @ReqContext() ctx: RequestContext,
  ): Promise<JobSearchSuggestionsResponseDto> {
    const user = ctx.user as UserAccessTokenClaims | undefined;

    const result = await this.jobSearchService.getJobSuggestionsWithPermissions(
      {
        query,
        user,
      },
    );

    return { suggestions: result.suggestions };
  }
}
