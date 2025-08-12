import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { ReqContext } from '@/shared/request-context/req-context.decorator';
import { RequestContext } from '@/shared/request-context/request-context.dto';

import { GenerateQuizReqDto } from '../dtos/req/generate-quiz.req';
import {
  SubmitAllAnswersReqDto,
  SubmitAnswerReqDto,
} from '../dtos/req/submit-answer.req';
import { QuizResDto } from '../dtos/res/quiz.res';
import { QuizAttemptResDto } from '../dtos/res/quiz-attempt.res';
import { QuizWithAttemptsResDto } from '../dtos/res/quiz-with-attempts.res';
import { QuizService } from '../services/quiz.service';
import { QuizAiService } from '../services/quiz-ai.service';
import { QuizAttemptService } from '../services/quiz-attempt.service';

@ApiTags('AI Quiz')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai-quiz')
export class QuizController {
  constructor(
    private readonly quizService: QuizService,
    private readonly quizAiService: QuizAiService,
    private readonly attemptService: QuizAttemptService,
  ) {}

  /**
   * Generate quiz - can be new or retry existing
   */
  @Post('generate')
  @ApiOperation({ summary: 'Generate or get quiz from roadmap' })
  @ApiBody({ type: GenerateQuizReqDto })
  @ApiQuery({ name: 'forceNew', required: false, type: Boolean })
  @ApiCreatedResponse({ type: QuizResDto })
  async generateQuiz(
    @ReqContext() ctx: RequestContext,
    @Body() dto: GenerateQuizReqDto,
    @Query('forceNew') forceNew?: boolean,
  ): Promise<QuizResDto> {
    if (!ctx.user) {
      throw new UnauthorizedException('User must be logged in');
    }

    // Call AI service with forceNew flag
    const quiz = await this.quizAiService.generateOrGetQuiz(
      dto.roadmapId,
      ctx.user.id,
      forceNew === true,
      dto.title,
      dto.description,
    );

    return this.mapToDto(quiz);
  }

  /**
   * Get quiz and attempts history by roadmap
   */
  @Get('roadmap/:roadmapId')
  @ApiOperation({ summary: 'Get quiz and attempts history by roadmap' })
  @ApiOkResponse({ type: QuizWithAttemptsResDto })
  async getQuizByRoadmap(
    @ReqContext() ctx: RequestContext,
    @Param('roadmapId') roadmapId: string,
  ): Promise<QuizWithAttemptsResDto | null> {
    if (!ctx.user) {
      throw new UnauthorizedException('User must be logged in');
    }

    // Get current quiz
    const quiz = await this.quizService.findByRoadmapAndUser(
      roadmapId,
      ctx.user.id,
    );

    if (!quiz) {
      return null;
    }

    // Get attempts history
    const attempts = await this.quizService.getQuizAttempts(
      quiz.id,
      ctx.user.id,
    );

    // Get statistics
    const stats = await this.quizService.getQuizStats(quiz.id, ctx.user.id);

    // Check if can retake (max 3 completed attempts)
    const completedAttempts = attempts.filter((a) => a.status === 'completed');
    const canRetake = completedAttempts.length < 3 && !stats.passed;
    const remainingAttempts = Math.max(0, 3 - completedAttempts.length);

    return {
      quiz: this.mapToDto(quiz),
      attempts: attempts.map((a) => this.mapAttemptToDto(a)),
      hasCompleted: stats.totalAttempts > 0,
      bestScore: stats.bestScore,
      attemptsCount: completedAttempts.length,
      canRetake,
      passed: stats.passed,
      remainingAttempts,
    };
  }

  /**
   * Get quiz details by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get quiz details by ID' })
  @ApiOkResponse({ type: QuizResDto })
  async getQuizById(
    @ReqContext() ctx: RequestContext,
    @Param('id') id: string,
  ): Promise<QuizResDto> {
    if (!ctx.user) {
      throw new UnauthorizedException('User must be logged in');
    }

    const quiz = await this.quizService.findById(id);

    // Check ownership
    if (quiz.userId !== ctx.user.id) {
      throw new UnauthorizedException('You can only view your own quizzes');
    }

    return this.mapToDto(quiz);
  }

  /**
   * Get user quiz list
   */
  @Get('user/list')
  @ApiOperation({ summary: 'Get user quiz list' })
  @ApiOkResponse({ type: [QuizResDto] })
  async getUserQuizzes(
    @ReqContext() ctx: RequestContext,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<any> {
    if (!ctx.user) {
      throw new UnauthorizedException('User must be logged in');
    }

    const result = await this.quizService.findByUserId(
      ctx.user.id,
      page,
      limit,
    );

    return {
      data: result.data.map((q) => this.mapToDto(q)),
      total: result.total,
      page,
      limit,
    };
  }

  /**
   * Get quiz history
   */
  @Get('history/:quizId')
  @ApiOperation({ summary: 'Get quiz attempt history' })
  @ApiOkResponse({ type: [QuizAttemptResDto] })
  async getQuizHistory(
    @ReqContext() ctx: RequestContext,
    @Param('quizId') quizId: string,
  ): Promise<QuizAttemptResDto[]> {
    if (!ctx.user) {
      throw new UnauthorizedException('User must be logged in');
    }

    return this.attemptService.getQuizHistory(ctx.user, quizId);
  }

  /**
   * Delete quiz
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete quiz' })
  @ApiOkResponse({ description: 'Quiz deleted successfully' })
  async deleteQuiz(
    @ReqContext() ctx: RequestContext,
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    if (!ctx.user) {
      throw new UnauthorizedException('User must be logged in');
    }

    const quiz = await this.quizService.findById(id);

    if (quiz.userId !== ctx.user.id) {
      throw new UnauthorizedException('You can only delete your own quizzes');
    }

    await this.quizService.delete(id);

    return { message: 'Quiz deleted successfully' };
  }

  /**
   * Start quiz attempt
   */
  @Post('attempt/:quizId/start')
  @ApiOperation({ summary: 'Start quiz attempt' })
  @ApiCreatedResponse({ type: QuizAttemptResDto })
  async startAttempt(
    @ReqContext() ctx: RequestContext,
    @Param('quizId') quizId: string,
  ): Promise<QuizAttemptResDto> {
    if (!ctx.user) {
      throw new UnauthorizedException('User must be logged in');
    }

    const attempt = await this.attemptService.startAttempt(ctx.user, quizId);
    return this.mapAttemptToDto(attempt);
  }

  /**
   * Submit all answers at once
   */
  @Post('attempt/:attemptId/submit-all')
  @ApiOperation({ summary: 'Submit all answers and complete quiz' })
  @ApiBody({ type: SubmitAllAnswersReqDto })
  @ApiOkResponse({ type: QuizAttemptResDto })
  async submitAllAnswers(
    @ReqContext() ctx: RequestContext,
    @Param('attemptId') attemptId: string,
    @Body() dto: SubmitAllAnswersReqDto,
  ): Promise<QuizAttemptResDto> {
    if (!ctx.user) {
      throw new UnauthorizedException('User must be logged in');
    }

    const attempt = await this.attemptService.submitAllAnswers(
      ctx.user,
      attemptId,
      dto,
    );
    return this.mapAttemptToDto(attempt);
  }

  /**
   * Submit answer (deprecated - kept for backward compatibility)
   */
  @Post('attempt/:attemptId/answer')
  @ApiOperation({ summary: 'Submit answer for a question' })
  @ApiBody({ type: SubmitAnswerReqDto })
  @ApiOkResponse({ description: 'Answer submitted' })
  async submitAnswer(
    @ReqContext() ctx: RequestContext,
    @Param('attemptId') attemptId: string,
    @Body() dto: SubmitAnswerReqDto,
  ): Promise<{ isCorrect: boolean; explanation: string }> {
    if (!ctx.user) {
      throw new UnauthorizedException('User must be logged in');
    }

    return this.attemptService.submitAnswer(ctx.user, attemptId, dto);
  }

  /**
   * Complete quiz attempt
   */
  @Post('attempt/:attemptId/complete')
  @ApiOperation({ summary: 'Complete quiz attempt' })
  @ApiOkResponse({ type: QuizAttemptResDto })
  async completeAttempt(
    @ReqContext() ctx: RequestContext,
    @Param('attemptId') attemptId: string,
  ): Promise<QuizAttemptResDto> {
    if (!ctx.user) {
      throw new UnauthorizedException('User must be logged in');
    }

    const attempt = await this.attemptService.completeAttempt(
      ctx.user,
      attemptId,
    );
    return this.mapAttemptToDto(attempt);
  }

  /**
   * Helper: Map Quiz to DTO
   */
  private mapToDto(quiz: any): QuizResDto {
    return {
      id: quiz.id,
      roadmapId: quiz.roadmapId,
      userId: quiz.userId,
      title: quiz.title,
      description: quiz.description,
      questions: quiz.questions,
      totalQuestions: quiz.totalQuestions,
      passingScore: quiz.passingScore,
      timeLimit: quiz.timeLimit,
      status: quiz.status,
      metadata: quiz.metadata,
      isRetry: quiz.isRetry || false,
      createdAt: quiz.createdAt,
      updatedAt: quiz.updatedAt,
    };
  }

  /**
   * Helper: Map Attempt to DTO
   */
  private mapAttemptToDto(attempt: any): QuizAttemptResDto {
    return {
      id: attempt.id,
      quizId: attempt.quizId,
      roadmapId: attempt.roadmapId,
      userId: attempt.userId,
      answers: attempt.answers,
      score: attempt.score,
      percentage: attempt.percentage,
      passed: attempt.passed,
      startedAt: attempt.startedAt,
      completedAt: attempt.completedAt,
      timeSpent: attempt.timeSpent,
      status: attempt.status,
      feedback: attempt.feedback,
      attemptNumber: attempt.attemptNumber || 1,
      createdAt: attempt.createdAt,
    };
  }
}
