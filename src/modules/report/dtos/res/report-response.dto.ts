import { ReportStatus } from '../../entities/report.entity';

export class ReportResponseDto {
  id: string;
  title: string;
  description: string;
  status: ReportStatus;
  userId: number;
  jobId: string;
  createdAt: Date;
  updatedAt: Date;

  // Optional populated fields
  user?: {
    id: number;
    name: string;
    email: string;
  };

  job?: {
    id: string;
    title: string;
    location?: string;
    company?: {
      id: string;
      name: string;
    };
  };
}
