export interface VerificationEmailPayload {
  to: string;
  token: string;
  [key: string]: unknown;
}
