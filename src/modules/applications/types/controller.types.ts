import { BaseApiResponse } from '@/shared/dtos/base-api-response.dto';

import { ApplicationDetailResponseDto } from '../dtos/application-detail-response.dto';
import { HrApplicationResponseDto } from '../dtos/hr-applications-response.dto';
import { JobApplicationResponseDto } from '../dtos/job-appication-response.dto';
import { UpdateJobApplicationResponseDto } from '../dtos/update-job-application-response.dto';

// Controller return types
export type UpdateApplicationResponse = UpdateJobApplicationResponseDto;
export type GetApplicationsResponse = BaseApiResponse<
  JobApplicationResponseDto[]
>;
export type GetApplicationDetailResponse = ApplicationDetailResponseDto;
export type GetHrApplicationsResponse = BaseApiResponse<
  HrApplicationResponseDto[]
>;
