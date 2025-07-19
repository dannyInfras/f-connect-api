import { ApiProperty } from '@nestjs/swagger';

import { TaskResDto } from './task.res';

export class ListTaskResDto {
  @ApiProperty({ type: [TaskResDto] })
  items: TaskResDto[];

  @ApiProperty({
    example: {
      total: 10,
      page: 1,
      limit: 10,
    },
  })
  meta: {
    total: number;
    page: number;
    limit: number;
  };
} 