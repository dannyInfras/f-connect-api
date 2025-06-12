import { UserAccessTokenClaims } from '../../auth/dtos/auth-token-output.dto';
import { ApplicationStatus } from '../enums/application-status.enum';

// Repository method parameter types
export interface FindByUserIdParams {
  userId: number;
  limit: number;
  offset: number;
}

export interface FindByJobIdParams {
  jobId: number;
  limit: number;
  offset: number;
}

// Repository query builder types
export interface FindApplicationsQueryOptions {
  limit?: number;
  offset?: number;
  relations?: string[];
  where?: Record<string, any>;
}

// Entity transformation types
export interface CreateApplicationData {
  userId: number;
  jobId: number;
  cvId?: string;
  coverLetter?: string;
}

// Repository method parameter interfaces
export interface GetJobApplicationsParams {
  jobId: number;
  limit: number;
  offset: number;
}

export interface GetApplicationDetailParams {
  applicationId: number;
}

export interface GetCandidateProfileParams {
  userId: number;
}

// Repository return types
export interface ApplicationsWithCount {
  applications: any[];
  count: number;
}

export interface DetailedApplicationData {
  id: number;
  status: ApplicationStatus;
  cv_id?: string;
  cover_letter?: string;
  applied_at: Date;
  updated_at: Date;
  user: UserAccessTokenClaims & {
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
  };
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
}

// Raw candidate profile data from database
export interface CandidateProfileRaw {
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
}

// Application with full relations for detailed view
export interface ApplicationWithFullRelations {
  id: number;
  status: ApplicationStatus;
  cv_id?: string;
  cover_letter?: string;
  applied_at: Date;
  updated_at: Date;
  user: {
    id: number;
    name: string;
    email: string;
    phone?: string;
    avatar?: string;
    gender?: 'MALE' | 'FEMALE' | 'OTHER';
  };
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
}
