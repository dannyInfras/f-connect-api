import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Quiz } from '../entities/quiz.entity';
import { QuizAttempt } from '../entities/quiz-attempt.entity';

@Injectable()
export class QuizService {
  constructor(
    @InjectRepository(Quiz)
    private readonly quizRepository: Repository<Quiz>,
    @InjectRepository(QuizAttempt)
    private readonly attemptRepository: Repository<QuizAttempt>,
  ) {}

  /**
   * Tạo quiz mới
   */
  async create(quiz: Partial<Quiz>): Promise<Quiz> {
    const entity = this.quizRepository.create(quiz);
    return this.quizRepository.save(entity);
  }

  /**
   * Lấy quiz theo ID
   */
  async findById(id: string): Promise<Quiz> {
    const quiz = await this.quizRepository.findOne({ where: { id } });
    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }
    return quiz;
  }

  /**
   * Lấy quiz theo roadmap và user
   */
  async findByRoadmapAndUser(
    roadmapId: string,
    userId: number,
  ): Promise<Quiz | null> {
    return this.quizRepository.findOne({
      where: {
        roadmapId,
        userId,
        status: 'published',
      },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Lấy tất cả quiz của user
   */
  async findByUserId(
    userId: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: Quiz[]; total: number }> {
    const skip = (page - 1) * limit;

    const [data, total] = await this.quizRepository.findAndCount({
      where: { userId },
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return { data, total };
  }

  /**
   * Cập nhật quiz
   */
  async update(id: string, updates: Partial<Quiz>): Promise<Quiz> {
    await this.quizRepository.update(id, updates);
    return this.findById(id);
  }

  /**
   * Xóa quiz
   */
  async delete(id: string): Promise<void> {
    const result = await this.quizRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Quiz not found');
    }
  }

  /**
   * Archive quiz cũ
   */
  async archiveExisting(roadmapId: string, userId: number): Promise<void> {
    await this.quizRepository.update(
      { roadmapId, userId, status: 'published' },
      { status: 'archived' },
    );
  }

  /**
   * Lấy attempts của quiz
   */
  async getQuizAttempts(
    quizId: string,
    userId: number,
  ): Promise<QuizAttempt[]> {
    return this.attemptRepository.find({
      where: {
        quizId,
        userId,
      },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Lấy thống kê quiz
   */
  async getQuizStats(
    quizId: string,
    userId: number,
  ): Promise<{
    totalAttempts: number;
    bestScore: number;
    averageScore: number;
    lastAttemptDate: Date | null;
    passed: boolean;
  }> {
    const attempts = await this.getQuizAttempts(quizId, userId);

    if (attempts.length === 0) {
      return {
        totalAttempts: 0,
        bestScore: 0,
        averageScore: 0,
        lastAttemptDate: null,
        passed: false,
      };
    }

    const scores = attempts.map((a) => a.percentage || 0);
    const bestScore = Math.max(...scores);
    const averageScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    const lastAttempt = attempts[0];
    const passed = attempts.some((a) => a.passed);

    return {
      totalAttempts: attempts.length,
      bestScore: Math.round(bestScore),
      averageScore: Math.round(averageScore),
      lastAttemptDate: lastAttempt?.createdAt || null,
      passed,
    };
  }
}
