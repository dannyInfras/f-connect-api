import { JobSearchSuggestionsResponseDto } from '../dtos/job-search-suggestions-output.dto';

// Controller return types
export type JobSearchResponse = {
  data: any[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  filters: any;
};
export type JobSearchSuggestionsResponse = JobSearchSuggestionsResponseDto;
