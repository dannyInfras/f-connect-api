// Export module
export { JobSearchModule } from './job-search.module';

// Export DTOs
export { JobSearchDto } from './dtos/job-search-input.dto';

export { JobSearchSuggestionsResponseDto } from './dtos/job-search-suggestions-output.dto';

// Export Enums
export { JobSearchSortBy, EmploymentType, JobLevel } from './enums';

// Export services
export { JobSearchService } from './services/job-search.service';
export { JobSearchCacheService } from './services/job-search-cache.service';
export { JobSearchAclService } from './acl/job-search-acl.service';

// Export repositories
export { JobSearchRepository } from './repositories/job-search.repository';

// Export controller
export { JobSearchController } from './controllers/job-search.controller';

// Export Types
export type {
  JobSearchResponse,
  JobSearchSuggestionsResponse,
  SearchJobsServiceParams,
  GetJobSuggestionsServiceParams,
  JobSearchServiceResponse,
  JobSuggestionsServiceResponse,
  JobSearchFilters,
  JobSearchOptions,
  JobWithApplicationStats,
  JobSearchQueryParams,
  JobSearchResult,
  JobSearchJobResult,
} from './types';
