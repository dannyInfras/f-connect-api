import { ApiProperty } from '@nestjs/swagger';

/**
 * Keyword suggestion item
 */
export class KeywordSuggestionDto {
  @ApiProperty({
    description: 'The suggestion keyword',
    example: 'Software Engineer',
  })
  value: string;

  @ApiProperty({
    description: 'Type of suggestion',
    example: 'keyword',
  })
  type: 'keyword';
}

/**
 * Job suggestion item
 */
export class JobSuggestionDto {
  @ApiProperty({
    description: 'Job ID',
    example: '123',
  })
  id: string;

  @ApiProperty({
    description: 'Job title/name',
    example: 'Senior Software Engineer',
  })
  title: string;

  @ApiProperty({
    description: 'Company name',
    example: 'Filo Connect',
  })
  companyName: string;

  @ApiProperty({
    description: 'Company logo URL',
    example: 'https://example.com/logo.png',
  })
  companyLogo?: string;

  @ApiProperty({
    description: 'Job location',
    example: 'Ho Chi Minh City',
  })
  location?: string;

  @ApiProperty({
    description: 'Type of employment',
    example: 'FULL_TIME',
  })
  typeOfEmployment: string;

  @ApiProperty({
    description: 'Type of suggestion',
    example: 'job',
  })
  type: 'job';
}

/**
 * Company suggestion item
 */
export class CompanySuggestionDto {
  @ApiProperty({
    description: 'Company ID',
    example: '456',
  })
  id: string;

  @ApiProperty({
    description: 'Company name',
    example: 'Filo Connect',
  })
  name: string;

  @ApiProperty({
    description: 'Company logo URL',
    example: 'https://example.com/logo.png',
  })
  logoUrl?: string;

  @ApiProperty({
    description: 'Company industry',
    example: 'Technology',
  })
  industry?: string;

  @ApiProperty({
    description: 'Type of suggestion',
    example: 'company',
  })
  type: 'company';
}

/**
 * Response DTO for job search suggestions
 */
export class JobSearchSuggestionsResponseDto {
  @ApiProperty({
    type: [KeywordSuggestionDto],
    description: 'Keyword suggestions',
    maxItems: 3,
  })
  keywords: KeywordSuggestionDto[];

  @ApiProperty({
    type: [JobSuggestionDto],
    description: 'Related job suggestions',
    maxItems: 5,
  })
  jobs: JobSuggestionDto[];

  @ApiProperty({
    type: [CompanySuggestionDto],
    description: 'Company suggestions',
    maxItems: 2,
  })
  companies: CompanySuggestionDto[];
}
