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

  @Expose()
  @ApiProperty({
    description: 'List of skills in the candidate profile',
    required: false,
  })
  skills?: { name: string; proficiencyLevel?: string }[];
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

export class CompanyProfileDto {
  @Expose()
  @ApiProperty()
  id: string;

  @Expose()
  @ApiProperty()
  name: string;

  @Expose()
  @ApiProperty()
  logoUrl?: string;

  @Expose()
  @ApiProperty()
  website?: string;

  @Expose()
  @ApiProperty()
  phone?: string;

  @Expose()
  @ApiProperty()
  email?: string;

  @Expose()
  @ApiProperty()
  about?: string;

  @Expose()
  @ApiProperty()
  contact?: any;
}

export class InterviewScheduleDto {
  @Expose()
  @ApiProperty({ description: 'Company name' })
  companyName: string;

  @Expose()
  @ApiProperty({ description: 'User ID who created the event' })
  createdBy: number;

  @Expose()
  @ApiProperty({ description: 'Event title' })
  title: string;

  @Expose()
  @ApiProperty({ description: 'Type of event' })
  type: string;

  @Expose()
  @ApiProperty({ description: 'Event status' })
  status: string;

  @Expose()
  @ApiProperty({ description: 'Event start time' })
  startsAt: Date;

  @Expose()
  @ApiProperty({ description: 'Event end time' })
  endsAt: Date;

  @Expose()
  @ApiProperty({ description: 'Event location', required: false })
  location?: string;

  @Expose()
  @ApiProperty({ description: 'Event notes', required: false })
  notes?: string;

  @Expose()
  @ApiProperty({ description: 'Optimistic version' })
  version: number;

  @Expose()
  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @Expose()
  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
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
  @ApiProperty({ description: 'AI assessment status' })
  ai_status: string;

  @Expose()
  @ApiProperty({ description: 'AI assessment score', required: false })
  ai_score?: number;

  @Expose()
  @ApiProperty({ description: 'AI detailed analysis', required: false })
  ai_analysis?: string;

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

  @Expose()
  @ApiProperty({
    required: false,
    description:
      'Interview schedule if exists (deprecated, use interviewSchedules)',
  })
  interviewSchedule?: InterviewScheduleDto;

  @Expose()
  @ApiProperty({
    type: [InterviewScheduleDto],
    required: false,
    description: 'All interview schedules for this application',
  })
  @Type(() => InterviewScheduleDto)
  interviewSchedules?: InterviewScheduleDto[];
}

export class JobWithoutCompanyDto {
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
}

export class CandidateApplicationDetailResponseDto {
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
  @ApiProperty({ type: JobWithoutCompanyDto })
  @Type(() => JobWithoutCompanyDto)
  job: JobWithoutCompanyDto;

  @Expose()
  @ApiProperty({ type: CompanyProfileDto })
  @Type(() => CompanyProfileDto)
  company: CompanyProfileDto;

  @Expose()
  @ApiProperty({
    required: false,
    description:
      'Interview schedule if exists (deprecated, use interviewSchedules)',
  })
  interviewSchedule?: InterviewScheduleDto;

  @Expose()
  @ApiProperty({
    type: [InterviewScheduleDto],
    required: false,
    description: 'All interview schedules for this application',
  })
  @Type(() => InterviewScheduleDto)
  interviewSchedules?: InterviewScheduleDto[];
}

export class ApplicationDetailApiResponse extends BaseApiResponse<ApplicationDetailResponseDto> {
  @ApiProperty({ type: ApplicationDetailResponseDto })
  declare data: ApplicationDetailResponseDto;
}

export class CandidateApplicationDetailApiResponse extends BaseApiResponse<CandidateApplicationDetailResponseDto> {
  @ApiProperty({ type: CandidateApplicationDetailResponseDto })
  declare data: CandidateApplicationDetailResponseDto;
}
