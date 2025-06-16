import { ApiProperty } from '@nestjs/swagger';

import { ApplicationStatus } from '../enums/application-status.enum';

/**
 * Response DTO for candidate information in HR applications view
 */
export class HrApplicationCandidateDto {
  @ApiProperty({ description: 'Candidate ID' })
  id: string;

  @ApiProperty({ description: 'Candidate full name' })
  name: string;

  @ApiProperty({ description: 'Candidate avatar URL', required: false })
  avatar_url?: string;
}

/**
 * Response DTO for job information in HR applications view
 */
export class HrApplicationJobDto {
  @ApiProperty({ description: 'Job ID' })
  id: string;

  @ApiProperty({ description: 'Job title' })
  title: string;
}

/**
 * Response DTO for HR applications list view
 */
export class HrApplicationResponseDto {
  @ApiProperty({ description: 'Application ID' })
  id: string;

  @ApiProperty({ enum: ApplicationStatus, enumName: 'ApplicationStatus' })
  status: ApplicationStatus;

  @ApiProperty({ description: 'Date when application was submitted' })
  applied_at: Date;

  @ApiProperty({ type: HrApplicationCandidateDto })
  candidate: HrApplicationCandidateDto;

  @ApiProperty({ type: HrApplicationJobDto })
  job: HrApplicationJobDto;
}

/**
 * Paginated response wrapper for HR applications
 */
export class HrApplicationsResponseDto {
  @ApiProperty({ type: [HrApplicationResponseDto] })
  data: HrApplicationResponseDto[];

  @ApiProperty({
    description: 'Response metadata',
    example: {
      count: 19,
    },
  })
  meta: {
    count: number;
  };
}
