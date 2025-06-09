export interface JobApplicationEmailPayload {
  to: string;
  applicantName: string;
  jobTitle: string;
  companyName: string;
  appliedDate: string;
  cvSubmitted: boolean;
  coverLetter?: string;
  cvFileUrl?: string;
  [key: string]: unknown;
}
