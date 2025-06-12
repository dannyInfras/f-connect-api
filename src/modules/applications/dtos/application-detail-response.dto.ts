import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

import { BaseApiResponse } from '@/shared/dtos/base-api-response.dto';

import { ApplicationStatus } from '../enums/application-status.enum';

export class CandidateDetailDto {
  @Expose()
  @ApiProperty()
  id: number;

  @Expose()
  @ApiProperty()
  name: string;

  @Expose()
  @ApiProperty()
  email: string;

  @Expose()
  @ApiProperty()
  phone?: string;

  @Expose()
  @ApiProperty()
  avatar?: string;

  @Expose()
  @ApiProperty()
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
}

export class CandidateProfileDetailDto {
  @Expose()
  @ApiProperty()
  id: string;

  @Expose()
  @ApiProperty()
  title?: string;

  @Expose()
  @ApiProperty()
  company?: string;

  @Expose()
  @ApiProperty()
  location?: string;

  @Expose()
  @ApiProperty()
  avatar?: string;

  @Expose()
  @ApiProperty()
  coverImage?: string;

  @Expose()
  @ApiProperty()
  isOpenToOpportunities: boolean;

  @Expose()
  @ApiProperty()
  about?: string;

  @Expose()
  @ApiProperty()
  contact?: any;

  @Expose()
  @ApiProperty()
  social?: any;

  @Expose()
  @ApiProperty()
  birthDate?: string;

  @Expose()
  @ApiProperty()
  experiences?: any[];

  @Expose()
  @ApiProperty()
  educations?: any[];
}

export class JobSummaryDto {
  @Expose()
  @ApiProperty()
  id: string;

  @Expose()
  @ApiProperty()
  title: string;

  @Expose()
  @ApiProperty()
  location?: string;

  @Expose()
  @ApiProperty()
  typeOfEmployment: string;

  @Expose()
  @ApiProperty()
  company: {
    id: string;
    companyName: string;
    logoUrl?: string;
  };
}

export class ApplicationDetailResponseDto {
  @Expose()
  @ApiProperty()
  id: number;

  @Expose()
  @ApiProperty()
  status: ApplicationStatus;

  @Expose()
  @ApiProperty()
  cv_id?: string;

  @Expose()
  @ApiProperty()
  cover_letter?: string;

  @Expose()
  @ApiProperty()
  applied_at: Date;

  @Expose()
  @ApiProperty()
  updated_at: Date;

  @Expose()
  @ApiProperty({ type: CandidateDetailDto })
  @Type(() => CandidateDetailDto)
  candidate: CandidateDetailDto;

  @Expose()
  @ApiProperty({ type: CandidateProfileDetailDto })
  @Type(() => CandidateProfileDetailDto)
  candidateProfile?: CandidateProfileDetailDto;

  @Expose()
  @ApiProperty({ type: JobSummaryDto })
  @Type(() => JobSummaryDto)
  job: JobSummaryDto;
}

export class ApplicationDetailApiResponse extends BaseApiResponse<ApplicationDetailResponseDto> {
  @ApiProperty({ type: ApplicationDetailResponseDto })
  declare data: ApplicationDetailResponseDto;
}
