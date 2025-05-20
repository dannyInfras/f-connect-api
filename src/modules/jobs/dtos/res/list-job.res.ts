import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

import { BaseApiResponse } from '@/shared/dtos/base-api-response.dto';

export class JobResponseDto {
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
  @ApiProperty({ example: 'New York', required: false })
  location: string;

  @Expose()
  @ApiProperty({ example: 'FullTime' })
  typeOfEmployment: string;

  @Expose()
  @ApiProperty({ example: 'OPEN' })
  status: string;

  @Expose()
  @ApiProperty({ example: true })
  isVip: boolean;

  @Expose()
  @ApiProperty()
  createdAt: Date;

  @Expose()
  @ApiProperty()
  updatedAt: Date;

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
    location: 'New York',
    typeOfEmployment: 'FullTime',
    status: 'OPEN',
    isVip: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };
}

export class ListJobResponseDto extends BaseApiResponse<JobResponseDto[]> {
  @ApiProperty({
    type: [JobResponseDto],
    example: {
      data: [JobResponseDto.example],
      meta: {
        count: 1,
        page: 1,
      },
    },
  })
  declare data: JobResponseDto[];
}
