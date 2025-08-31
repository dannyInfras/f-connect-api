import { ReportResponseDto } from './report-response.dto';

export class ReportsListResponseDto {
  reports: ReportResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
