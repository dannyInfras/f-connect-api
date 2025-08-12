import { ApiProperty } from '@nestjs/swagger';

import { QuizMetadata,QuizQuestion } from '../../entities/quiz.entity';

export class QuizResDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  roadmapId: string;

  @ApiProperty()
  userId: number;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ type: [Object] })
  questions: QuizQuestion[];

  @ApiProperty()
  totalQuestions: number;

  @ApiProperty()
  passingScore: number;

  @ApiProperty()
  timeLimit: number;

  @ApiProperty()
  status: string;

  @ApiProperty()
  metadata: QuizMetadata;

  @ApiProperty()
  isRetry?: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
