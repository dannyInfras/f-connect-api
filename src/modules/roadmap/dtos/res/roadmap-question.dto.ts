import { ApiProperty } from '@nestjs/swagger';

export class RoadmapQuestionDto {
  @ApiProperty({ example: 'q1' })
  id: string;

  @ApiProperty({ example: 'What is TypeScript?' })
  question: string;

  @ApiProperty({ example: ['A', 'B', 'C', 'D'], type: [String] })
  options: string[];

  @ApiProperty({ example: 1, description: 'Index (0-based) of correct answer' })
  correctAnswer: number;

  @ApiProperty({ example: 1, required: false })
  userAnswer?: number;
} 