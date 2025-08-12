import { ApiProperty } from '@nestjs/swagger';

import { QuizFeedback,UserAnswer } from '../../entities/quiz-attempt.entity';

export class QuizAttemptResDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  quizId: string;

  @ApiProperty()
  roadmapId: string;

  @ApiProperty()
  userId: number;

  @ApiProperty({ type: [Object] })
  answers: UserAnswer[];

  @ApiProperty()
  score: number;

  @ApiProperty()
  percentage: number;

  @ApiProperty()
  passed: boolean;

  @ApiProperty()
  startedAt: Date;

  @ApiProperty()
  completedAt: Date;

  @ApiProperty()
  timeSpent: number;

  @ApiProperty()
  status: string;

  @ApiProperty()
  feedback: QuizFeedback;

  @ApiProperty()
  attemptNumber: number;

  @ApiProperty()
  createdAt: Date;
}
