import { ApiProperty } from '@nestjs/swagger';

import { RoadmapQuestionDto } from './roadmap-question.dto';

export class RoadmapTestDto {
  @ApiProperty({ example: 'test-1' })
  id: string;

  @ApiProperty({ example: 'JavaScript Basics Assessment' })
  title: string;

  @ApiProperty({ example: 'Evaluate your JS knowledge' })
  description: string;

  @ApiProperty({ example: false })
  completed: boolean;

  @ApiProperty({ example: 80, required: false })
  score?: number;

  @ApiProperty({ type: () => [RoadmapQuestionDto] })
  questions: RoadmapQuestionDto[];
} 