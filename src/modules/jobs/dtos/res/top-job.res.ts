import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class TopJobResponseDto {
  @Expose()
  @ApiProperty({ example: '1' })
  id: string;

  @Expose()
  @ApiProperty({ example: 'Senior Software Engineer' })
  title: string;

  @Expose()
  @ApiProperty({
    example: { id: '1', name: 'Software Development' },
    description: 'The category associated with the job',
  })
  category: {
    id: string;
    name: string;
  };

  @Expose()
  @ApiProperty({
    example: { id: '1', companyName: 'Tech Corp' },
    description: 'The company associated with the job',
  })
  company: {
    id: string;
    companyName: string;
    logoUrl: string;
  };

  @Expose()
  @ApiProperty({
    example: [
      { id: '1', name: 'JavaScript' },
      { id: '2', name: 'TypeScript' },
    ],
    description: 'The skills required for the job',
  })
  skills: {
    id: string;
    name: string;
  }[];

  @Expose()
  @ApiProperty({ example: 'We are looking for a senior software engineer...' })
  description: string;

  @Expose()
  @ApiProperty({ example: 'New York', required: false })
  location: string;

  @Expose()
  @ApiProperty({ example: 80000, required: false })
  salaryMin: number;

  @Expose()
  @ApiProperty({ example: 120000, required: false })
  salaryMax: number;

  @Expose()
  @ApiProperty({ example: 5, required: false })
  experienceYears: number;

  @Expose()
  @ApiProperty({ example: 'FULL_TIME' })
  typeOfEmployment: string;

  @Expose()
  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', required: true })
  deadline: Date;

  @Expose()
  @ApiProperty({
    example: false,
    description: 'Whether the job has been soft deleted',
    required: false,
  })
  isDeleted: boolean;

  @Expose()
  @ApiProperty({
    example: 1,
    description: 'Top job position (1-16, where 0 means not a top job)',
    required: false,
  })
  topJob: number;

  @Expose()
  @ApiProperty({
    example: '2024-12-31T23:59:59.999Z',
    description: 'Date when Top Job status expires',
    required: false,
  })
  topJobExpired?: Date;

  static example = {
    id: '1',
    title: 'Senior Software Engineer',
    category: { id: '1', name: 'Software Development' },
    company: {
      id: '1',
      companyName: 'Tech Corp',
      logoUrl: 'https://example.com/logo.png',
    },
    skills: [
      { id: '1', name: 'JavaScript' },
      { id: '2', name: 'TypeScript' },
    ],
    description: 'We are looking for a senior software engineer...',
    location: 'New York',
    salaryMin: 80000,
    salaryMax: 120000,
    experienceYears: 5,
    typeOfEmployment: 'FULL_TIME',
    deadline: '2024-01-01T00:00:00.000Z',
    isDeleted: false,
    topJob: 1,
    topJobExpired: '2024-12-31T23:59:59.999Z',
  };
}

export class TopJobsListResponseDto {
  @ApiProperty({
    type: [TopJobResponseDto],
    example: {
      data: [TopJobResponseDto.example],
      meta: {
        count: 1,
        page: 1,
      },
    },
  })
  data: TopJobResponseDto[];

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
