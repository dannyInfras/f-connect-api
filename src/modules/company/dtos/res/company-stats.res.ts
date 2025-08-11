import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

export class JobCategoryCountDto {
  @Expose()
  @ApiProperty({ example: '1' })
  categoryId: string;

  @Expose()
  @ApiProperty({ example: 'Engineering' })
  name: string;

  @Expose()
  @ApiProperty({ example: 7 })
  count: number;
}

export class JobStatsDto {
  @Expose()
  @ApiProperty({
    description: 'Breakdown of job counts by common status buckets',
    example: { open: 9, closed: 3, active: 8, expired: 4 },
  })
  byStatus: {
    open: number;
    closed: number;
    active: number;
    expired: number;
  };

  @Expose()
  @ApiProperty({
    example: 5,
    description: 'Number of jobs created in the previous calendar month',
  })
  lastMonth: number;

  @Expose()
  @Type(() => JobCategoryCountDto)
  @ApiProperty({ type: [JobCategoryCountDto] })
  byCategory: JobCategoryCountDto[];
}

export class ApplicationStatsDto {
  @Expose()
  @ApiProperty({
    example: [
      { status: 'APPLIED', count: 120 },
      { status: 'IN_REVIEW', count: 50 },
    ],
    description: 'Counts of applications grouped by status',
  })
  byStatus: Array<{ status: string; count: number }>;

  @Expose()
  @ApiProperty({
    example: 60,
    description: 'Applications created in the previous calendar month',
  })
  lastMonth: number;

  @Expose()
  @ApiProperty({ example: 3, description: 'Applications created today' })
  today: number;
}

export class CompanyStatsResponseDto {
  @Expose()
  @ApiProperty({
    example: 12,
    description: 'Total number of jobs posted by the company',
  })
  totalJobs: number;

  @Expose()
  @ApiProperty({
    example: 248,
    description: 'Total number of applications across all company jobs',
  })
  totalApplications: number;

  @Expose()
  @Type(() => JobStatsDto)
  @ApiProperty({ type: () => JobStatsDto })
  jobs: JobStatsDto;

  @Expose()
  @Type(() => ApplicationStatsDto)
  @ApiProperty({ type: () => ApplicationStatsDto })
  applications: ApplicationStatsDto;

  static example: CompanyStatsResponseDto = {
    totalJobs: 12,
    totalApplications: 248,
    jobs: {
      byStatus: { open: 9, closed: 3, active: 8, expired: 4 },
      lastMonth: 5,
      byCategory: [
        { categoryId: '1', name: 'Engineering', count: 7 },
        { categoryId: '2', name: 'Design', count: 3 },
      ],
    },
    applications: {
      byStatus: [
        { status: 'APPLIED', count: 120 },
        { status: 'IN_REVIEW', count: 50 },
        { status: 'INTERVIEW', count: 20 },
        { status: 'HIRED', count: 8 },
        { status: 'REJECTED', count: 50 },
      ],
      lastMonth: 60,
      today: 3,
    },
  };
}
