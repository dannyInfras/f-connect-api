// Repository method parameter types
export interface JobSearchQueryParams {
  query?: string;
  categoryIds?: number[];
  companyIds?: number[];
  employmentTypes?: string[];
  jobLevels?: string[];
  salaryMin?: number;
  salaryMax?: number;
  minExperienceYears?: number;
  location?: string;
  activeOnly?: boolean;
  sortBy: string;
  cursor?: string;
  limit: number;
  page?: number;
}

export interface JobSearchSuggestionsParams {
  query: string;
  limit: number;
}

// Repository return types
export interface JobSearchResult {
  jobs: JobSearchJobResult[];
  hasNextPage: boolean;
  nextCursor?: string;
  totalCount: number;
}

export interface JobSearchJobResult {
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
  rank?: number;
}

export interface JobSearchSuggestionsResult {
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
