import type { JobApplicationEmailPayload } from '../../../shared/mail/interfaces';

// Export all application types organized by concern
export * from './controller.types';
export * from './repository.types';
export * from './service.types';

// Re-export shared email types for convenience
export type { JobApplicationEmailPayload } from '../../../shared/mail/interfaces';

// Type aliases for better readability in applications module
export type JobApplicationEmailType = JobApplicationEmailPayload;
export type EmailNotificationData = JobApplicationEmailPayload;
