import type { JobApplicationEmailPayload } from '@/shared/mail/interfaces';

// Export controller types
export type {
  UpdateApplicationResponse,
  GetApplicationsResponse,
  GetApplicationDetailResponse,
  GetHrApplicationsResponse,
} from './controller.types';

// Export repository types
export type {
  FindByUserIdParams,
  FindByJobIdParams,
  CreateApplicationData,
  GetApplicationDetailParams,
  GetCandidateProfileParams,
  ApplicationsWithCount as RepositoryApplicationsWithCount,
  CandidateProfileRaw,
  ApplicationWithFullRelations,
} from './repository.types';

// Export service types
export type {
  CreateApplicationServiceParams,
  GetUserApplicationsServiceParams,
  GetJobApplicationsServiceParams,
  GetHrApplicationsServiceParams,
  UpdateApplicationServiceParams,
  ApplicationsWithCount as ServiceApplicationsWithCount,
  HrApplicationsWithCount,
  CreateApplicationResponse as ServiceCreateApplicationResponse,
  UpdateApplicationServiceResponse,
  ApplicationDetailResponse,
  DetailedApplication,
  DetailedApplicationWithProfile,
  StatusTransitionParams,
  ApplicationWithRelations,
} from './service.types';

// Re-export shared email types for convenience
export type { JobApplicationEmailPayload } from '@/shared/mail/interfaces';

// Type aliases for better readability in applications module
export type JobApplicationEmailType = JobApplicationEmailPayload;
export type EmailNotificationData = JobApplicationEmailPayload;
