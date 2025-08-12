import { ApiProperty } from '@nestjs/swagger';

import { QuizResDto } from './quiz.res';
import { QuizAttemptResDto } from './quiz-attempt.res';

export class QuizWithAttemptsResDto {
  @ApiProperty()
  quiz: QuizResDto;

  @ApiProperty({ type: [QuizAttemptResDto] })
  attempts: QuizAttemptResDto[];

  @ApiProperty()
  hasCompleted: boolean;

  @ApiProperty()
  bestScore: number;

  @ApiProperty()
  attemptsCount: number;

  @ApiProperty()
  canRetake: boolean;

  @ApiProperty()
  passed: boolean;

  @ApiProperty()
  remainingAttempts: number;
}
