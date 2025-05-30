import { ApiProperty } from '@nestjs/swagger';

import { BaseApiResponse } from '@/shared/dtos/base-api-response.dto';

import { CvEducation, CvExperience } from '../../entities/cv.entity';
import { Certification } from '../../interfaces/certification.interface';

export class CvResDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'Senior Software Engineer CV' })
  title: string;

  @ApiProperty({ example: 'A brief summary of my professional experience...' })
  summary?: string;

  @ApiProperty({
    example: [
      {
        company: 'Tech Corp',
        role: 'Senior Developer',
        description: 'Led team of 5 developers...',
        employmentType: 'FULL_TIME',
        location: 'New York',
        startDate: '2020-01-01',
        endDate: '2023-01-01',
      },
    ],
  })
  experience: CvExperience[];

  @ApiProperty({
    example: [
      {
        institution: 'University of Tech',
        degree: 'Bachelor',
        field: 'Computer Science',
        startYear: 2016,
        endYear: 2020,
        description: 'Major in Software Engineering',
      },
    ],
  })
  education: CvEducation[];

  @ApiProperty({ example: 'JavaScript, TypeScript, Node.js...' })
  skills?: string;

  @ApiProperty({
    example: [
      {
        title: 'AWS Certified Developer',
        issuer: 'Amazon Web Services',
        issueDate: '2023-01-01',
        expiryDate: '2026-01-01',
        credentialId: 'AWS-123456',
        credentialUrl: 'https://aws.amazon.com/verification/123456',
      },
    ],
  })
  certifications: Certification[];

  @ApiProperty({ example: 'English (Native), Spanish (Intermediate)...' })
  languages?: string;

  @ApiProperty({ example: 1 })
  templateId?: number;

  @ApiProperty({ example: 52 })
  userId: number;

  @ApiProperty({ example: '2024-03-15T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-03-15T10:30:00.000Z' })
  updatedAt: Date;

  static example = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    title: 'Senior Software Engineer CV',
    summary: 'A brief summary of my professional experience...',
    experience: [
      {
        company: 'Tech Corp',
        role: 'Senior Developer',
        description: 'Led team of 5 developers...',
        employmentType: 'FULL_TIME',
        location: 'New York',
        startDate: '2020-01-01',
        endDate: '2023-01-01',
      },
    ],
    education: [
      {
        institution: 'University of Tech',
        degree: 'Bachelor',
        field: 'Computer Science',
        startYear: 2016,
        endYear: 2020,
        description: 'Major in Software Engineering',
      },
    ],
    skills: 'JavaScript, TypeScript, Node.js...',
    certifications: [
      {
        title: 'AWS Certified Developer',
        issuer: 'Amazon Web Services',
        issueDate: '2023-01-01',
        expiryDate: '2026-01-01',
        credentialId: 'AWS-123456',
        credentialUrl: 'https://aws.amazon.com/verification/123456',
      },
    ],
    languages: 'English (Native), Spanish (Intermediate)...',
    templateId: 1,
    userId: 1,
  };
}

export class ListCvResDto extends BaseApiResponse<CvResDto[]> {
  @ApiProperty({
    type: [CvResDto],
    example: {
      data: [CvResDto.example],
      meta: {
        count: 1,
        page: 1,
      },
    },
  })
  declare data: CvResDto[];
}
