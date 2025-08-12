import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';

export class SubmitAnswerReqDto {
  @ApiProperty({ example: 'question-uuid' })
  @IsString()
  @IsNotEmpty()
  questionId: string;

  @ApiProperty({ example: ['a', 'b'], type: [String] })
  @IsArray()
  @IsString({ each: true })
  selectedAnswers: string[];
}

export class QuizAnswerDto {
  @ApiProperty({ example: 'question-uuid' })
  @IsString()
  @IsNotEmpty()
  questionId: string;

  @ApiProperty({ example: ['a'], type: [String] })
  @IsArray()
  @IsString({ each: true })
  selectedAnswers: string[];
}

export class SubmitAllAnswersReqDto {
  @ApiProperty({ type: [QuizAnswerDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuizAnswerDto)
  answers: QuizAnswerDto[];
}
