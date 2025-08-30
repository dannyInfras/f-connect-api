import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { ReportStatus } from '../../entities/report.entity';

export class UpdateReportStatusDto {
  @ApiProperty({
    description: 'New status for the report',
    enum: ReportStatus,
    example: ReportStatus.REVIEWED,
  })
  @IsNotEmpty()
  @IsEnum(ReportStatus)
  status: ReportStatus;

  @ApiPropertyOptional({
    description: 'Optional note from admin regarding the status update',
    example: 'Reviewed by moderator. Job seems legitimate. Closing the report.',
  })
  @IsOptional()
  @IsString()
  adminNote?: string;

  // Example for documentation/testing convenience
  static readonly example = {
    status: ReportStatus.REVIEWED,
    adminNote: 'Reviewed by moderator. Content violates posting policy.',
  };
}
