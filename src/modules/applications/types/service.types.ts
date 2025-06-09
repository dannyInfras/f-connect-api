import { UserAccessTokenClaims } from '../../auth/dtos/auth-token-output.dto';
import { JobApplicationResponseDto } from '../dtos/job-appication-response.dto';
import { ApplicationStatus } from '../enums/application-status.enum';

// Service method parameter types
export interface CreateApplicationParams {
  dto: {
    jobId: number;
    cvId?: string;
    coverLetter?: string;
  };
  user: UserAccessTokenClaims;
}

export interface GetUserApplicationsParams {
  user: UserAccessTokenClaims;
  limit?: number;
  offset?: number;
}

export interface GetJobApplicationsParams {
  jobId: number;
  user: UserAccessTokenClaims;
  limit?: number;
  offset?: number;
}

export interface UpdateApplicationParams {
  id: number;
  dto: {
    status?: ApplicationStatus;
  };
  user: UserAccessTokenClaims;
}

// Service return types
export interface ApplicationsWithCount {
  applications: JobApplicationResponseDto[];
  count: number;
}

// Status transition validation types
export interface StatusTransitionParams {
  currentStatus: ApplicationStatus;
  newStatus: ApplicationStatus;
}

// Application creation internal types
export interface ApplicationWithRelations {
  id: number;
  user: {
    email: string;
    name: string;
  };
  job: {
    title: string;
    company: {
      companyName: string;
    };
  };
  cv_id?: string;
  applied_at: Date;
}
