// src/modules/company/dtos/res/create-company.res.ts
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

import { JobDetailResponseDto } from '../../../jobs/dtos/res/job.res';
import { BenefitResDto } from './benefit.res';
import { CoreTeamMemberResDto } from './core-team.res';

export class CompanyDetailResponseDto {
  @Expose()
  @ApiProperty({ example: 'abc123' })
  id: string;

  @Expose()
  @ApiProperty({ example: 'https://logo.url/openai.png' })
  logoUrl: string;

  @Expose()
  @ApiProperty({ example: 'OpenAI' })
  companyName: string;

  @Expose()
  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  foundedAt: Date;

  @Expose()
  @ApiProperty({ example: 100 })
  employees: number;

  @Expose()
  @ApiProperty({ example: ['San Francisco, CA', 'New York, NY'] })
  address: string[];

  @Expose()
  @ApiProperty({ example: 'https://openai.com' })
  website: string;

  @Expose()
  @ApiProperty({ example: 'Technology' })
  industry: string;

  @Expose()
  @ApiProperty({ example: 'AI Research Company' })
  description: string;

  @Expose()
  @ApiProperty({ example: ['twitter.com/Nomad', 'facebook.com/NomadHQ'] })
  socialMedia: string[];

  @Expose()
  @ApiProperty({ example: ['https://working.url/Nomad.png'] })
  workImageUrl: string[];

  @Expose()
  @Type(() => CoreTeamMemberResDto)
  @ApiProperty({ type: [CoreTeamMemberResDto] })
  coreTeam: CoreTeamMemberResDto[];

  @Expose()
  @Type(() => BenefitResDto)
  @ApiProperty({ type: [BenefitResDto] })
  benefits: BenefitResDto[];

  @Expose()
  @Type(() => JobDetailResponseDto)
  @ApiProperty({ type: [JobDetailResponseDto] })
  openPositions: JobDetailResponseDto[];

  @Expose()
  @ApiProperty({ example: '123456789' })
  taxCode: string;

  @Expose()
  @ApiProperty({ example: 'https://license.url/openai.pdf' })
  businessLicenseUrl: string;

  @Expose()
  @ApiProperty()
  createdAt: Date;

  @Expose()
  @ApiProperty()
  updatedAt: Date;

  static example = {
    id: 'abc123',
    logoUrl: 'https://logo.url/openai.png',
    companyName: 'OpenAI',
    foundedAt: '2024-01-01T00:00:00.000Z',
    employees: 100,
    address: ['San Francisco, CA', 'New York, NY'],
    website: 'https://openai.com',
    industry: 'Technology',
    description: 'AI Research Company',
    socialMedia: [
      'twitter.com/Nomad',
      'facebook.com/NomadHQ',
      'linkedin.com/company/nomad',
      'nomad@gmail.com',
    ],
    workImageUrl: [
      'https://working.url/Nomad.png',
      'https://working.url/Nomad2.png',
    ],
    coreTeam: [
      {
        id: '1',
        name: 'John Doe',
        position: 'CEO',
        imageUrl: 'https://team.url/johndoe.png',
      },
      {
        id: '2',
        name: 'Jane Smith',
        position: 'CTO',
        imageUrl: 'https://team.url/janesmith.png',
      },
    ],
    benefits: [
      {
        id: 'benefit1',
        name: 'Health Insurance',
        description: 'Comprehensive health insurance for all employees.',
        iconUrl: 'https://icon.url/health.png',
      },
      {
        id: 'benefit2',
        name: 'Paid Time Off',
        description: 'Generous paid time off policy.',
        iconUrl: 'https://icon.url/time-off.png',
      },
      {
        id: 'benefit3',
        name: 'Remote Work',
        description: 'Flexible remote work options.',
        iconUrl: 'https://icon.url/remote-work.png',
      },
    ],
    openPositions: [
      {
        id: '1',
        title: 'Senior Software Engineer',
        category: { id: '1', name: 'Software Development' },
        location: 'New York',
        typeOfEmployment: 'FullTime',
        status: 'OPEN',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    ],
    taxCode: '123456789',
    businessLicenseUrl: 'https://license.url/openai.pdf',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };
}
