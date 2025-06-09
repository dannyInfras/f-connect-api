import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

import { BaseApiResponse } from '../../../shared/dtos/base-api-response.dto';
import { Company } from '../../company/entities/company.entity';
import { Job } from '../../jobs/entities/jobs.entity';
import { User } from '../../user/entities/user.entity';
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

export class PaginatedJobApplicationResponseDto extends BaseApiResponse<
  JobApplicationResponseDto[]
> {
  @ApiProperty({ type: [JobApplicationResponseDto] })
  declare data: JobApplicationResponseDto[];
}
