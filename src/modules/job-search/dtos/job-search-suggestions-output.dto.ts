import { ApiProperty } from '@nestjs/swagger';

/**
 * Response DTO for job search suggestions
 */
export class JobSearchSuggestionsResponseDto {
  @ApiProperty({
    type: [String],
    description: 'List of job search suggestions',
    example: ['Software Engineer', 'Frontend Developer', 'Backend Developer'],
  })
  suggestions: string[];
}
