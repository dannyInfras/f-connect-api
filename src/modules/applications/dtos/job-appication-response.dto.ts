import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

import { Job } from '@/modules/jobs/entities/jobs.entity';
import { User } from '@/modules/user/entities/user.entity';

import { Company } from '../../company/entities/company.entity';
import { ApplicationStatus } from '../enums/application-status.enum';

export class JobApplicationResponseDto {
  @Expose()
  @ApiProperty()
  id: string;

  @Expose()
  @ApiProperty()
  job: Job;

  @Expose()
  @ApiProperty()
  company: Company;

  @Expose()
  @ApiProperty()
  user: User;

  @Expose()
  @ApiProperty()
  status: ApplicationStatus;

  @Expose()
  @ApiProperty()
  cv_id: string;

  @Expose()
  @ApiProperty()
  cover_letter: string;

  @Expose()
  @ApiProperty()
  applied_at: Date;

  @Expose()
  @ApiProperty()
  updated_at: Date;

  @Expose()
  @ApiProperty({
    description: 'Whether the application has been read',
    default: false,
  })
  isRead: boolean;

  @Expose()
  @ApiProperty({
    description: 'AI analysis score (0-100)',
    required: false,
    type: Number,
  })
  ai_score?: number;

  @Expose()
  @ApiProperty({
    description: 'AI analysis of the application',
    required: false,
    type: String,
  })
  ai_analysis?: string;

  @Expose()
  @ApiProperty({
    description: 'AI processing status',
    required: false,
    type: String,
    enum: ['PENDING', 'PENDING_SCORE', 'PROCESSING', 'COMPLETED', 'FAILED'],
  })
  ai_status?: string;
}
