import { ApiProperty } from '@nestjs/swagger';

import { RoadmapTaskDto } from './roadmap-task.dto';
import { RoadmapTestDto } from './roadmap-test.dto';

export class RoadmapSkillDto {
  @ApiProperty({ example: 'skill-1' })
  id: string;

  @ApiProperty({ example: 'Node.js Fundamentals' })
  title: string;

  @ApiProperty({ example: 'Learn server-side JavaScript with Node.js' })
  description: string;

  @ApiProperty({ example: 0 })
  progress: number;

  @ApiProperty({ type: () => [RoadmapTaskDto] })
  tasks: RoadmapTaskDto[];

  @ApiProperty({ type: () => RoadmapTestDto, required: false })
  test?: RoadmapTestDto;
} 