import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

import { BenefitResDto } from '@/modules/company/dtos/res/benefit.res';
import { CoreTeamMemberResDto } from '@/modules/company/dtos/res/core-team.res';
import { JobDetailResponseDto } from '@/modules/jobs/dtos/res/job.res';

class AdminCompanyUserBrief {
  @ApiProperty({ example: 1 })
  @Expose()
  id: number;

  @ApiProperty({ example: 'john.doe' })
  @Expose()
  username: string;

  @ApiProperty({ example: 'John Doe' })
  @Expose()
  name: string;

  @ApiProperty({ example: 'john@company.com' })
  @Expose()
  email: string;

  @ApiProperty({ example: false })
  @Expose()
  isAccountDisabled: boolean;
}

export class AdminCompanyDetailOutput {
  @ApiProperty({ example: '123' })
  @Expose()
  id: string;

  @ApiProperty({ example: 'https://logo.url/openai.png', required: false })
  @Expose()
  logoUrl?: string;

  @ApiProperty({ example: 'OpenAI' })
  @Expose()
  companyName: string;

  @ApiProperty({ example: 1234567890, required: false })
  @Expose()
  phone?: number;

  @ApiProperty({ example: 'contact@company.com', required: false })
  @Expose()
  email?: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', required: false })
  @Expose()
  foundedAt?: Date;

  @ApiProperty({ example: 100, required: false })
  @Expose()
  employees?: number;

  @ApiProperty({ type: [String], example: ['San Francisco, CA'] })
  @Expose()
  address: string[];

  @ApiProperty({ example: 'https://company.com', required: false })
  @Expose()
  website?: string;

  @ApiProperty({ example: 'Technology', required: false })
  @Expose()
  industry?: string;

  @ApiProperty({ example: 'AI Research Company', required: false })
  @Expose()
  description?: string;

  @ApiProperty({ type: [String], example: ['twitter.com/company'] })
  @Expose()
  socialMedia: string[];

  @ApiProperty({ type: [String], example: ['https://work-image.url/1.png'] })
  @Expose()
  workImageUrl: string[];

  @ApiProperty({ type: [CoreTeamMemberResDto] })
  @Type(() => CoreTeamMemberResDto)
  @Expose()
  coreTeam: CoreTeamMemberResDto[];

  @ApiProperty({ type: [BenefitResDto] })
  @Type(() => BenefitResDto)
  @Expose()
  benefits: BenefitResDto[];

  @ApiProperty({ type: [JobDetailResponseDto] })
  @Type(() => JobDetailResponseDto)
  @Expose()
  openPositions: JobDetailResponseDto[];

  @ApiProperty({ example: '123456789' })
  @Expose()
  taxCode: string;

  @ApiProperty({ example: 'https://license.url/openai.pdf', required: false })
  @Expose()
  businessLicenseUrl?: string;

  @ApiProperty({ example: true })
  @Expose()
  isVerified: boolean;

  @ApiProperty({ type: [AdminCompanyUserBrief] })
  @Type(() => AdminCompanyUserBrief)
  @Expose()
  users: AdminCompanyUserBrief[];

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;
}
