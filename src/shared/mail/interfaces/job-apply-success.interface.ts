// Email notification payload for job application success
export interface JobApplicationEmailPayload {
  to: string;
  applicantName: string;
  jobTitle: string;
  companyName: string;
  appliedDate: string;
  cvSubmitted: boolean;
  coverLetter?: string;
  cvFileUrl?: string; // CV file URL for Supabase storage
  [key: string]: unknown;
}
