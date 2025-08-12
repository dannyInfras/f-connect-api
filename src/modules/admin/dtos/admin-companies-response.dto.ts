import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

import { AdminCompanyOutput } from './admin-company-output.dto';

export class AdminCompaniesResponseDto {
  @ApiProperty({ type: [AdminCompanyOutput] })
  @Type(() => AdminCompanyOutput)
  @Expose()
  companies: AdminCompanyOutput[];

  @ApiProperty({ example: 1 })
  @Expose()
  limit: number;

  @ApiProperty({ example: 0 })
  @Expose()
  offset: number;

  @ApiProperty({ example: 10 })
  @Expose()
  count: number;
}
