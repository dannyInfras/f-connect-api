import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class JobApplicationSimplifiedDto {
  @ApiProperty({
    description: 'Application ID',
    example: '123',
  })
  id: string;

  @Expose()
  @ApiProperty({
    description: 'Name of the applicant',
    example: 'Jane Doe',
  })
  applicantName: string;

  @ApiProperty({
    description: 'Current status of the application',
    example: 'Under Review',
  })
  applicationStatus: string;

  @ApiProperty({
    description: 'Date when the application was submitted',
    example: '2025-06-15',
  })
  appliedDate: string;

  @ApiProperty({
    description: 'AI analysis score (0-100)',
    required: false,
    type: Number,
    example: 85,
  })
  ai_score?: number;

  @ApiProperty({
    description: 'AI analysis of the application',
    required: false,
    type: String,
    example:
      'Strong technical background with relevant experience in React and Node.js',
  })
  ai_analysis?: string;

  @ApiProperty({
    description: 'AI processing status',
    required: false,
    type: String,
    enum: ['PENDING', 'PENDING_SCORE', 'PROCESSING', 'COMPLETED', 'FAILED'],
    example: 'COMPLETED',
  })
  ai_status?: string;
}

export class JobApplicationsSimplifiedMetaDto {
  @ApiProperty({
    description: 'Total number of applications',
    example: 25,
  })
  count: number;
}

export class JobApplicationsSimplifiedResponseDto {
  @ApiProperty({
    type: [JobApplicationSimplifiedDto],
    description: 'List of applications for the job',
  })
  applications: JobApplicationSimplifiedDto[];

  @ApiProperty({
    type: JobApplicationsSimplifiedMetaDto,
    description: 'Pagination metadata',
  })
  meta: JobApplicationsSimplifiedMetaDto;
}
