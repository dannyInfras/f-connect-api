import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class JobApplicationSimplifiedDto {
  @ApiProperty({
    description: 'Name of the applicant',
    example: 'Jane Doe',
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
