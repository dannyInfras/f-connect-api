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
}
