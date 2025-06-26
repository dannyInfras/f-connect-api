import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class HrJobResponseDto {
  @Expose()
  @ApiProperty({ example: '1' })
  jobId: string;

  @Expose()
  @ApiProperty({ example: 'Software Engineer' })
  jobTitle: string;

  @Expose()
  @ApiProperty({ example: 'Open' })
  status: string;

  @Expose()
  @ApiProperty({ example: '2025-06-01' })
  postedDate: string;

  @Expose()
  @ApiProperty({ example: '2025-06-30' })
  endDate: string;

  @Expose()
  @ApiProperty({ example: 'Full-time' })
  jobType: string;

  @Expose()
  @ApiProperty({ example: 25 })
  totalApplications: number;

  static example = {
    jobId: '1',
    jobTitle: 'Software Engineer',
    status: 'Open',
    postedDate: '2025-06-01',
    endDate: '2025-06-30',
    jobType: 'Full-time',
    totalApplications: 25,
  };
}

export class HrJobsListResponseDto {
  @ApiProperty({
    type: [HrJobResponseDto],
    example: [HrJobResponseDto.example],
  })
  data: HrJobResponseDto[];

  @ApiProperty({
    example: {
      count: 1,
      page: 1,
    },
  })
  meta: {
    count: number;
    page: number;
  };
}
