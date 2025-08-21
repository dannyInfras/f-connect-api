import { PartialType } from '@nestjs/swagger';
import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

import { CreateJobReqDto } from '../req/create-job.req';

export class UpdateJobDto extends PartialType(CreateJobReqDto) {
  @ApiProperty({
    example: 'CLOSED',
    required: false,
    enum: ['OPEN', 'CLOSED'],
    description: 'Trạng thái công việc',
  })
  @IsOptional()
  @IsIn(['OPEN', 'CLOSED'])
  status?: string;

  @ApiProperty({
    example: '2024-12-31T23:59:59.999Z',
    description: 'Top job expiration date',
    required: false,
  })
  @IsOptional()
  topJobExpired?: Date;
}
