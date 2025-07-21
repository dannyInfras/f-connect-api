import { ApiProperty } from '@nestjs/swagger';

import { RoadmapResDto } from './roadmap.res';

export class ListRoadmapResDto {
  @ApiProperty({ type: () => [RoadmapResDto] })
  items: RoadmapResDto[];

  @ApiProperty({
    example: { total: 2, page: 1, limit: 10 },
  })
  meta: {
    total: number;
    page: number;
    limit: number;
  };
} 