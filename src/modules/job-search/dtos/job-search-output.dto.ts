import { ApiProperty } from '@nestjs/swagger';

/**
 * Company details for job search results
 */
export class JobSearchCompanyDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  companyName: string;

  @ApiProperty({ required: false })
  logoUrl?: string;
}

/**
 * Category details for job search results
 */
export class JobSearchCategoryDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;
}

/**
 * Individual job search result item
 */
export class JobSearchResultDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  responsibility: string;

  @ApiProperty({ required: false })
  location?: string;

  @ApiProperty({ required: false })
  salaryMin?: number;

  @ApiProperty({ required: false })
  salaryMax?: number;

  @ApiProperty({ required: false })
  minExperienceYears?: number;

  @ApiProperty()
  typeOfEmployment: string;

  @ApiProperty()
  deadline: Date;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  company: JobSearchCompanyDto;

  @ApiProperty()
  category: JobSearchCategoryDto;

  @ApiProperty()
  totalApplications: number;

  @ApiProperty({ required: false })
  rank?: number;
}

/**
 * Pagination metadata for search results
 */
export class PaginationMetaDto {
  @ApiProperty()
  currentPage: number;

  @ApiProperty()
  itemsPerPage: number;

  @ApiProperty()
  totalItems: number;

  @ApiProperty()
  totalPages: number;

  @ApiProperty()
  hasNextPage: boolean;

  @ApiProperty()
  hasPreviousPage: boolean;
}

/**
 * Complete job search response with results and metadata
 */
export class JobSearchResponseDto {
  @ApiProperty({ type: [JobSearchResultDto] })
  data: JobSearchResultDto[];

  @ApiProperty()
  pagination: PaginationMetaDto;

  @ApiProperty()
  filters: any;
}
