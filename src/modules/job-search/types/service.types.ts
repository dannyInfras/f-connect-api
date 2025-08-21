import { UserAccessTokenClaims } from '../../auth/dtos/auth-token-output.dto';
import { JobSearchDto } from '../dtos/job-search-input.dto';

// Service method parameter types
export interface SearchJobsServiceParams {
  dto: JobSearchDto;
  user: UserAccessTokenClaims;
}

export interface GetJobSuggestionsServiceParams {
  query: string;
  user: UserAccessTokenClaims;
}

// Service return types
export interface JobSearchServiceResponse {
  data: JobWithApplicationStats[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  filters: {
    appliedFilters: {
      query?: string;
      location?: string;
      categoryIds?: number[];
      companyIds?: number[];
      employmentTypes?: string[];
      jobLevels?: string[];
      salaryRange?: { min?: number; max?: number };
      minExperienceYears?: number;
      activeOnly?: boolean;
    };
    availableCategories: Array<{ id: number; name: string; count: number }>;
    availableCompanies: Array<{ id: string; name: string; count: number }>;
    availableEmploymentTypes: Array<{ type: string; count: number }>;
    availableJobLevels: Array<{ level: string; count: number }>;
  };
}

export interface JobSuggestionsServiceResponse {
  keywords: string[];
  jobs: Array<{
    id: string;
    title: string;
    companyName: string;
    companyLogo?: string;
    location?: string;
    typeOfEmployment: string;
  }>;
  companies: Array<{
    id: string;
    name: string;
    logoUrl?: string;
    industry?: string;
  }>;
}

// Controller interaction types
export interface SearchJobsWithPermissionsParams {
  dto: JobSearchDto;
  user: UserAccessTokenClaims | undefined;
}

export interface GetJobSuggestionsWithPermissionsParams {
  query: string;
  user: UserAccessTokenClaims | undefined;
}

// Internal service types
export interface JobSearchFilters {
  categoryIds?: number[];
  companyIds?: number[];
  employmentTypes?: string[];
  jobLevels?: string[];
  salaryMin?: number;
  salaryMax?: number;
  minExperienceYears?: number;
  location?: string;
  activeOnly?: boolean;
}

export interface JobSearchOptions {
  query?: string;
  filters: JobSearchFilters;
  sortBy: string;
  cursor?: string;
  limit: number;
}

export interface JobWithApplicationStats {
  id: string;
  title: string;
  description: string;
  location?: string;
  typeOfEmployment: string;
  jobLevel?: string;
  salaryMin?: number;
  salaryMax?: number;
  minExperienceYears?: number;
  deadline: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  priorityPosition: number;
  company: {
    id: string;
    companyName: string;
    logoUrl?: string;
  };
  category: {
    id: number;
    name: string;
  };
  totalApplications: number;
  capacity?: number;
  isCapacityReached: boolean;
}
