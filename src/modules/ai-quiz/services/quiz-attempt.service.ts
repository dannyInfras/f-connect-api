import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Actor } from '@/shared/acl/actor.constant';

import { RoadmapRepository } from '../../roadmap/repositories/roadmap.repository';
import {
  SubmitAllAnswersReqDto,
  SubmitAnswerReqDto,
} from '../dtos/req/submit-answer.req';
import { QuizAttemptResDto } from '../dtos/res/quiz-attempt.res';
import {
  QuizAttempt,
  QuizFeedback,
  UserAnswer,
} from '../entities/quiz-attempt.entity';
import { QuizRepository } from '../repositories/quiz.repository';
import { QuizAttemptRepository } from '../repositories/quiz-attempt.repository';
import { QuizAiService } from './quiz-ai.service';

@Injectable()
export class QuizAttemptService {
  constructor(
    private readonly quizRepository: QuizRepository,
    private readonly attemptRepository: QuizAttemptRepository,
    private readonly quizAiService: QuizAiService,
    private readonly roadmapRepository: RoadmapRepository,
  ) {}

  /**
   * Start quiz attempt
   */
  async startAttempt(actor: Actor, quizId: string): Promise<QuizAttemptResDto> {
    const quiz = await this.quizRepository.getById(quizId);

    // Check if user owns the quiz
    if (quiz.userId !== actor.id) {
      throw new BadRequestException('You can only attempt your own quizzes');
    }

    // Check for existing in-progress attempt
    const existingAttempt = await this.attemptRepository.findInProgress(
      quizId,
      actor.id,
    );

    if (existingAttempt) {
      return this.mapToDto(existingAttempt);
    }

    // Check attempt limit (3 attempts per quiz - STRICT)
    const previousAttempts = await this.attemptRepository.findByQuizAndUser(
      quizId,
      actor.id,
    );

    // Count only completed attempts
    const completedAttempts = previousAttempts.filter(
      (a) => a.status === 'completed',
    );

    if (completedAttempts.length >= 3) {
      // Check if any attempt passed
      const hasPassed = completedAttempts.some((a) => a.passed);

      throw new BadRequestException(
        hasPassed
          ? 'You have already passed this quiz. No more attempts needed.'
          : 'You have reached the maximum number of attempts (3) for this quiz. Please generate a new quiz to continue practicing.',
      );
    }

    // Create quiz snapshot for history
    const quizSnapshot = {
      quizId: quiz.id,
      title: quiz.title,
      totalQuestions: quiz.totalQuestions,
      passingScore: quiz.passingScore,
      timeLimit: quiz.timeLimit,
      questions: quiz.questions.map((q) => ({
        id: q.id,
        question: q.question,
        type: q.type,
        difficulty: q.difficulty,
        topic: q.topic,
        points: q.points,
        answers: q.answers,
        explanation: q.explanation,
      })),
    };

    // Create new attempt
    const attempt = await this.attemptRepository.create({
      quizId,
      userId: actor.id,
      roadmapId: quiz.roadmapId,
      startedAt: new Date(),
      status: 'in-progress',
      answers: [],
      attemptNumber: completedAttempts.length + 1,
      quizSnapshot,
    });

    return this.mapToDto(attempt);
  }

  /**
   * Submit all answers at once and complete attempt
   */
  async submitAllAnswers(
    actor: Actor,
    attemptId: string,
    dto: SubmitAllAnswersReqDto,
  ): Promise<QuizAttemptResDto> {
    const attempt = await this.attemptRepository.getById(attemptId);

    // Check ownership
    if (attempt.userId !== actor.id) {
      throw new BadRequestException('This is not your attempt');
    }

    if (attempt.status !== 'in-progress') {
      throw new BadRequestException('This attempt is not in progress');
    }

    const quiz = await this.quizRepository.getById(attempt.quizId);

    // Process all answers with detailed information
    const userAnswers: UserAnswer[] = [];
    let totalScore = 0;
    let maxScore = 0;

    for (const answer of dto.answers) {
      const question = quiz.questions.find((q) => q.id === answer.questionId);

      if (!question) {
        continue; // Skip invalid question IDs
      }

      maxScore += question.points;

      // Get answer texts for history
      const selectedAnswerTexts = answer.selectedAnswers.map(
        (id) => question.answers.find((a) => a.id === id)?.text || '',
      );

      const correctAnswers = question.answers
        .filter((a) => a.isCorrect)
        .map((a) => a.id);

      const correctAnswerTexts = question.answers
        .filter((a) => a.isCorrect)
        .map((a) => a.text);

      const isCorrect = this.checkAnswer(
        question.type,
        answer.selectedAnswers,
        correctAnswers,
      );

      const earnedPoints = isCorrect ? question.points : 0;
      totalScore += earnedPoints;

      userAnswers.push({
        questionId: answer.questionId,
        questionText: question.question,
        questionType: question.type,
        questionDifficulty: question.difficulty,
        questionTopic: question.topic,
        selectedAnswers: answer.selectedAnswers,
        selectedAnswerTexts,
        correctAnswers,
        correctAnswerTexts,
        isCorrect,
        points: question.points,
        earnedPoints,
        answeredAt: new Date(),
      });
    }

    // Add unanswered questions to history
    for (const question of quiz.questions) {
      if (!userAnswers.find((a) => a.questionId === question.id)) {
        const correctAnswers = question.answers
          .filter((a) => a.isCorrect)
          .map((a) => a.id);

        const correctAnswerTexts = question.answers
          .filter((a) => a.isCorrect)
          .map((a) => a.text);

        userAnswers.push({
          questionId: question.id,
          questionText: question.question,
          questionType: question.type,
          questionDifficulty: question.difficulty,
          questionTopic: question.topic,
          selectedAnswers: [],
          selectedAnswerTexts: [],
          correctAnswers,
          correctAnswerTexts,
          isCorrect: false,
          points: question.points,
          earnedPoints: 0,
          answeredAt: new Date(),
        });
      }
    }

    // Calculate percentage
    const percentage =
      maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

    // Get roadmap for AI feedback
    const roadmap = await this.roadmapRepository.findOne({
      where: { id: quiz.roadmapId },
    });

    if (!roadmap) {
      throw new NotFoundException('Roadmap not found for quiz');
    }

    // Generate AI feedback (only if < 100%)
    let feedback: QuizFeedback;
    if (percentage < 100) {
      console.log('📊 Generating AI feedback for score:', percentage);

      // Create temporary attempt object for feedback generation
      const tempAttempt = { ...attempt, answers: userAnswers, percentage };

      feedback = await this.quizAiService.generateAIFeedback(
        tempAttempt,
        quiz,
        roadmap,
      );
    } else {
      // Perfect score - simple feedback
      feedback = {
        strengths: [
          'Perfect score! Outstanding mastery of all topics',
          'Exceptional understanding demonstrated',
          'Ready to apply knowledge in real-world scenarios',
        ],
        weaknesses: [],
        recommendations: [
          'You have mastered this material excellently',
          'Consider exploring advanced topics in this area',
        ],
        topicScores: this.calculateTopicScores(quiz, userAnswers),
      };
    }

    // Update attempt with all results
    const completedAt = new Date();
    const timeSpent = Math.floor(
      (completedAt.getTime() - attempt.startedAt.getTime()) / 1000,
    );

    const updatedAttempt = await this.attemptRepository.update(attempt.id, {
      answers: userAnswers,
      score: totalScore,
      percentage,
      passed: percentage >= 80, // Pass threshold is 80%
      completedAt,
      timeSpent,
      status: 'completed',
      feedback,
    });

    return this.mapToDto(updatedAttempt);
  }

  /**
   * Submit single answer (deprecated - kept for backward compatibility)
   */
  async submitAnswer(
    actor: Actor,
    attemptId: string,
    dto: SubmitAnswerReqDto,
  ): Promise<{ isCorrect: boolean; explanation: string }> {
    const attempt = await this.attemptRepository.getById(attemptId);

    // Check ownership
    if (attempt.userId !== actor.id) {
      throw new BadRequestException('This is not your attempt');
    }

    if (attempt.status !== 'in-progress') {
      throw new BadRequestException('This attempt is not in progress');
    }

    const quiz = await this.quizRepository.getById(attempt.quizId);
    const question = quiz.questions.find((q) => q.id === dto.questionId);

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    // Check answer
    const correctAnswers = question.answers
      .filter((a) => a.isCorrect)
      .map((a) => a.id);

    const isCorrect = this.checkAnswer(
      question.type,
      dto.selectedAnswers,
      correctAnswers,
    );

    // Get answer texts for full UserAnswer object
    const selectedAnswerTexts = dto.selectedAnswers.map(
      (id) => question.answers.find((a) => a.id === id)?.text || '',
    );

    const correctAnswerTexts = question.answers
      .filter((a) => a.isCorrect)
      .map((a) => a.text);

    // Create full UserAnswer object
    const userAnswer: UserAnswer = {
      questionId: dto.questionId,
      questionText: question.question,
      questionType: question.type,
      questionDifficulty: question.difficulty,
      questionTopic: question.topic,
      selectedAnswers: dto.selectedAnswers,
      selectedAnswerTexts,
      correctAnswers,
      correctAnswerTexts,
      isCorrect,
      points: question.points,
      earnedPoints: isCorrect ? question.points : 0,
      answeredAt: new Date(),
    };

    const existingIndex = attempt.answers.findIndex(
      (a) => a.questionId === dto.questionId,
    );

    if (existingIndex >= 0) {
      attempt.answers[existingIndex] = userAnswer;
    } else {
      attempt.answers.push(userAnswer);
    }

    await this.attemptRepository.save(attempt);

    return {
      isCorrect,
      explanation: question.explanation,
    };
  }

  /**
   * Complete attempt (deprecated - use submitAllAnswers instead)
   */
  async completeAttempt(
    actor: Actor,
    attemptId: string,
  ): Promise<QuizAttemptResDto> {
    const attempt = await this.attemptRepository.getById(attemptId);

    // Check ownership
    if (attempt.userId !== actor.id) {
      throw new BadRequestException('This is not your attempt');
    }

    if (attempt.status !== 'in-progress') {
      throw new BadRequestException('This attempt is not in progress');
    }

    const quiz = await this.quizRepository.getById(attempt.quizId);

    // Calculate score
    const { score, percentage } = this.calculateScore(quiz, attempt);

    // Get roadmap for AI feedback
    const roadmap = await this.roadmapRepository.findOne({
      where: { id: quiz.roadmapId },
    });

    if (!roadmap) {
      throw new NotFoundException('Roadmap not found for quiz');
    }

    // Generate AI feedback (only if < 100%)
    let feedback: QuizFeedback;
    if (percentage < 100) {
      console.log('📊 Generating AI feedback for score:', percentage);
      feedback = await this.quizAiService.generateAIFeedback(
        { ...attempt, percentage },
        quiz,
        roadmap,
      );
    } else {
      // Perfect score - simple feedback
      feedback = {
        strengths: [
          'Perfect score! Outstanding mastery of all topics',
          'Exceptional understanding demonstrated',
          'Ready to apply knowledge in real-world scenarios',
        ],
        weaknesses: [],
        recommendations: [
          'You have mastered this material excellently',
          'Consider exploring advanced topics in this area',
        ],
        topicScores: this.calculateTopicScores(quiz, attempt.answers),
      };
    }

    // Update attempt
    const completedAt = new Date();
    const timeSpent = Math.floor(
      (completedAt.getTime() - attempt.startedAt.getTime()) / 1000,
    );

    const updatedAttempt = await this.attemptRepository.update(attempt.id, {
      score,
      percentage,
      passed: percentage >= 80, // Pass threshold is 80%
      completedAt,
      timeSpent,
      status: 'completed',
      feedback,
    });

    return this.mapToDto(updatedAttempt);
  }

  /**
   * Get quiz history
   */
  async getQuizHistory(
    actor: Actor,
    quizId: string,
  ): Promise<QuizAttemptResDto[]> {
    const quiz = await this.quizRepository.getById(quizId);

    // Check ownership
    if (quiz.userId !== actor.id) {
      throw new BadRequestException('You can only view your own quiz history');
    }

    const attempts = await this.attemptRepository.findByQuizAndUser(
      quizId,
      actor.id,
    );

    return attempts.map((a) => this.mapToDto(a));
  }

  /**
   * Check answer
   */
  private checkAnswer(
    type: string,
    selected: string[],
    correct: string[],
  ): boolean {
    if (type === 'single-choice' || type === 'true-false') {
      return selected.length === 1 && selected[0] === correct[0];
    } else if (type === 'multiple-choice') {
      return (
        selected.length === correct.length &&
        selected.every((s) => correct.includes(s))
      );
    }
    return false;
  }

  /**
   * Calculate score
   */
  private calculateScore(
    quiz: any,
    attempt: QuizAttempt,
  ): { score: number; percentage: number } {
    let totalScore = 0;
    let maxScore = 0;

    quiz.questions.forEach((question: any) => {
      maxScore += question.points;

      const userAnswer = attempt.answers.find(
        (a) => a.questionId === question.id,
      );

      if (userAnswer && userAnswer.isCorrect) {
        totalScore += question.points;
      }
    });

    const percentage = Math.round((totalScore / maxScore) * 100);

    return {
      score: totalScore,
      percentage,
    };
  }

  /**
   * Calculate topic scores for feedback
   */
  private calculateTopicScores(
    quiz: any,
    answers: UserAnswer[],
  ): Record<string, { correct: number; total: number; percentage: number }> {
    const topicScores: Record<string, { correct: number; total: number }> = {};

    quiz.questions.forEach((question: any) => {
      if (!topicScores[question.topic]) {
        topicScores[question.topic] = { correct: 0, total: 0 };
      }
      topicScores[question.topic].total++;

      const userAnswer = answers.find((a) => a.questionId === question.id);
      if (userAnswer && userAnswer.isCorrect) {
        topicScores[question.topic].correct++;
      }
    });

    // Add percentages
    Object.keys(topicScores).forEach((topic) => {
      (topicScores[topic] as any).percentage = Math.round(
        (topicScores[topic].correct / topicScores[topic].total) * 100,
      );
    });

    return topicScores as any;
  }

  /**
   * Map to DTO
   */
  private mapToDto(attempt: QuizAttempt): QuizAttemptResDto {
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
