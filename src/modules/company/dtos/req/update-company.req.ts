import { PartialType } from '@nestjs/mapped-types';

import { CreateCompanyReqDto } from './create-company.req';

export class UpdateCompanyDto extends PartialType(CreateCompanyReqDto) {
  static example = {
    id: 'abc123',
    logoUrl: 'https://logo.url/openai.png',
    companyName: 'OpenAI',
    phone: 1234567890,
    email: '..@example.com',
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
