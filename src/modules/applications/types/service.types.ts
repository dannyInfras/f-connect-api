import { UserAccessTokenClaims } from '../../auth/dtos/auth-token-output.dto';
import { CreateJobApplicationDto } from '../dtos/create-job-application.dto';
import { JobApplicationResponseDto } from '../dtos/job-appication-response.dto';
import { UpdateJobApplicationDto } from '../dtos/update-job-application.dto';
import { ApplicationStatus } from '../enums/application-status.enum';

// Service method parameter interfaces
export interface CreateApplicationServiceParams {
  dto: CreateJobApplicationDto;
  user: UserAccessTokenClaims;
}

export interface GetUserApplicationsServiceParams {
  user: UserAccessTokenClaims;
  limit: number;
  offset: number;
}

export interface GetJobApplicationsServiceParams {
  jobId: number;
  user: UserAccessTokenClaims;
  limit: number;
  offset: number;
}

export interface UpdateApplicationServiceParams {
  id: number;
  dto: UpdateJobApplicationDto;
  user: UserAccessTokenClaims;
}

// Service return types
export interface ApplicationsWithCount {
  applications: JobApplicationResponseDto[];
  count: number;
}

export interface CreateApplicationResponse {
  id: number;
  status: ApplicationStatus;
  applied_at: Date;
}

export interface UpdateApplicationServiceResponse {
  message: string;
  success: boolean;
}

// Detailed application response type matching the DTO
export interface ApplicationDetailResponse {
  id: number;
  status: ApplicationStatus;
  cv_id?: string;
  cover_letter?: string;
  applied_at: Date;
  updated_at: Date;
  candidate: {
    id: number;
    name: string;
    email: string;
    phone?: string;
    avatar?: string;
    gender?: 'MALE' | 'FEMALE' | 'OTHER';
  };
  candidateProfile?: {
    id: string;
    title?: string;
    company?: string;
    location?: string;
    avatar?: string;
    coverImage?: string;
    isOpenToOpportunities: boolean;
    about?: string;
    contact?: any;
    social?: any;
    birthDate?: string;
    experiences?: any[];
    educations?: any[];
  } | null;
  job: {
    id: string;
    title: string;
    location?: string;
    typeOfEmployment: string;
    company: {
      id: string;
      companyName: string;
      logoUrl?: string;
    };
  };
}

// Helper types for relations
export interface DetailedApplication {
  id: number;
  status: ApplicationStatus;
  cv_id?: string;
  cover_letter?: string;
  applied_at: Date;
  updated_at: Date;
  job: {
    id: string;
    title: string;
    location?: string;
    typeOfEmployment: string;
    company: {
      id: string;
      companyName: string;
      logoUrl?: string;
      users?: UserAccessTokenClaims[];
    };
  };
  user: {
    id: number;
    name: string;
    email: string;
    phone?: string;
    avatar?: string;
    gender?: 'MALE' | 'FEMALE' | 'OTHER';
  };
}

export interface DetailedApplicationWithProfile extends DetailedApplication {
  candidateProfile?: {
    id: string;
    title?: string;
    company?: string;
    location?: string;
    avatar?: string;
    coverImage?: string;
    isOpenToOpportunities: boolean;
    about?: string;
    contact?: any;
    social?: any;
    birthDate?: string;
    experiences?: any[];
    educations?: any[];
  };
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
