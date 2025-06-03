import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

import { ApplicationStatus } from '../enums/application-status.enum';

export class UpdateJobApplicationDto {
  @IsEnum(ApplicationStatus)
  @IsOptional()
  @ApiProperty({
    example: ApplicationStatus.APPLIED,
    enum: ApplicationStatus,
    description: 'The status of the job application (optional)',
    required: false,
  })
  status?: ApplicationStatus;
}
