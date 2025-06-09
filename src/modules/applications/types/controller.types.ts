import { BaseApiResponse } from '../../../shared/dtos/base-api-response.dto';
import { PaginationParamsDto } from '../../../shared/dtos/pagination-params.dto';
import { RequestContext } from '../../../shared/request-context/request-context.dto';
import { CreateJobApplicationDto } from '../dtos/create-job-application.dto';
import { JobApplicationResponseDto } from '../dtos/job-appication-response.dto';
import { UpdateJobApplicationDto } from '../dtos/update-job-application.dto';
import { JobApplication } from '../entities/job-application.entity';

// Controller method parameter interfaces
export interface CreateApplicationControllerParams {
  createDto: CreateJobApplicationDto;
  ctx: RequestContext;
}

export interface GetUserApplicationsControllerParams {
  ctx: RequestContext;
  query: PaginationParamsDto;
}

export interface GetJobApplicationsControllerParams {
  ctx: RequestContext;
  jobId: number;
  query: PaginationParamsDto;
}

export interface UpdateApplicationControllerParams {
  id: number;
  updateDto: UpdateJobApplicationDto;
  ctx: RequestContext;
}

// Controller return types
export type CreateApplicationResponse = JobApplication;
export type UpdateApplicationResponse = JobApplication;
export type GetApplicationsResponse = BaseApiResponse<
  JobApplicationResponseDto[]
>;
