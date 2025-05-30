import { ApiProperty } from '@nestjs/swagger';

import { CvResDto } from './cv.res';

export class ListCvResDto {
  @ApiProperty({ type: [CvResDto] })
  items: CvResDto[];

  @ApiProperty({
    example: {
      total: 100,
      page: 1,
      limit: 10
    }
  })
  meta: {
    total: number;
    page: number;
    limit: number;
  };
} 
