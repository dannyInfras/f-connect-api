import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class JobDetailResponseDto {
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
    address: string;
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
  @ApiProperty({ example: 'OPEN' })
  status: string;

  @Expose()
  @ApiProperty({ example: 'FullTime' })
  typeOfEmployment: string;

  @Expose()
  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', required: true })
  deadline: Date;

  @Expose()
  @ApiProperty({ example: ['Develop web applications', 'Write clean code'] })
  responsibility: string[];

  @Expose()
  @ApiProperty({
    example: [
      'You get energy from people and building the ideal work environment',
      'You have a sense for beautiful spaces and office experiences',
    ],
  })
  jobFitAttributes: string[];

  @Expose()
  @ApiProperty({ example: ['Fluent in English', 'Project management skills'] })
  niceToHave: string[];

  @Expose()
  @ApiProperty({
    example: ['Health insurance', 'Gym membership'],
  })
  benefit: string[];

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
      address: '123 Tech Street, New York, NY',
    },
    skills: [
      { id: '1', name: 'JavaScript' },
      { id: '2', name: 'TypeScript' },
    ],
    responsibility: ['Develop web applications', 'Write clean code'],
    jobFitAttributes: [
      'You get energy from people and building the ideal work environment',
      'You have a sense for beautiful spaces and office experiences',
    ],
    niceToHave: ['Fluent in English', 'Project management skills'],
    description: 'We are looking for a senior software engineer...',
    location: 'New York',
    salaryMin: 80000,
    salaryMax: 120000,
    experienceYears: 5,
    status: 'OPEN',
    isVip: true,
    deadline: '2024-01-01T00:00:00.000Z',
    typeOfEmployment: 'FullTime',
    benefit: ['Health insurance', 'Gym membership'],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };
}
