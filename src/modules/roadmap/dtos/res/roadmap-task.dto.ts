import { ApiProperty } from '@nestjs/swagger';

export class RoadmapTaskDto {
  @ApiProperty({ example: 'task-1' })
  id: string;

  @ApiProperty({ example: 'Learn NestJS basics' })
  title: string;

  @ApiProperty({ example: false })
  completed: boolean;
} 