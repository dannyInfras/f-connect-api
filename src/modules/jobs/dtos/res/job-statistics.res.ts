import { ApiProperty } from '@nestjs/swagger';

export class TopCandidateDto {
  @ApiProperty()
  applicationId: number;

  @ApiProperty()
  userId: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;

  @ApiProperty({
    required: false,
    enum: ['MALE', 'FEMALE', 'OTHER'],
    nullable: true,
  })
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | null;

  @ApiProperty()
  ai_score: number;
}

export class JobStatisticsResponseDto {
  @ApiProperty()
  jobId: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: string;

  @ApiProperty({ type: String, format: 'date-time' })
  deadline: string;

  @ApiProperty()
  isExpired: boolean;

  @ApiProperty()
  daysUntilDeadline: number;

  @ApiProperty()
  totalApplications: number;

  @ApiProperty({ type: Object, additionalProperties: { type: 'number' } })
  applicationsByStatus: Record<string, number>;

  @ApiProperty()
  averageAiScore: number;

  @ApiProperty({ type: [TopCandidateDto] })
  topCandidatesByAiScore: TopCandidateDto[];

  @ApiProperty({
    type: 'object',
    properties: {
      gender: { additionalProperties: { type: 'number' } },
      age: { additionalProperties: { type: 'number' } },
      location: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            location: { type: 'string' },
            count: { type: 'number' },
          },
        },
      },
    },
  })
  demographics: {
    gender: Record<string, number>;
    age: Record<string, number>;
    location: Array<{ location: string; count: number }>;
  };

  static example: JobStatisticsResponseDto = {
    jobId: '123',
    title: 'Senior Backend Engineer',
    createdAt: new Date().toISOString(),
    deadline: new Date(Date.now() + 7 * 86400000).toISOString(),
    isExpired: false,
    daysUntilDeadline: 7,
    totalApplications: 42,
    applicationsByStatus: {
      APPLIED: 20,
      IN_REVIEW: 10,
      INTERVIEW: 8,
      HIRED: 2,
      REJECTED: 2,
    },
    averageAiScore: 76.5,
    topCandidatesByAiScore: [
      {
        applicationId: 1,
        userId: 101,
        name: 'Jane Doe',
        email: 'jane@example.com',
        gender: 'FEMALE',
        ai_score: 95,
      },
    ],
    demographics: {
      gender: { MALE: 22, FEMALE: 18, OTHER: 2 },
      age: { '18-24': 5, '25-34': 20, '35-44': 12, '45-54': 4, '55+': 1 },
      location: [
        { location: 'Hanoi', count: 15 },
        { location: 'HCMC', count: 12 },
      ],
    },
  };
}
