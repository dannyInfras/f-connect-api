import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { QuizAttempt } from '../entities/quiz-attempt.entity';

@Injectable()
export class QuizAttemptRepository {
  constructor(
    @InjectRepository(QuizAttempt)
    private readonly repo: Repository<QuizAttempt>,
  ) {}

  async create(attempt: Partial<QuizAttempt>): Promise<QuizAttempt> {
    const entity = this.repo.create(attempt);
    return this.repo.save(entity);
  }

  async findById(id: string): Promise<QuizAttempt | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['quiz'],
    });
  }

  async getById(id: string): Promise<QuizAttempt> {
    const attempt = await this.findById(id);
    if (!attempt) {
      throw new NotFoundException('Quiz attempt not found');
    }
    return attempt;
  }

  async findInProgress(
    quizId: string,
    userId: number,
  ): Promise<QuizAttempt | null> {
    return this.repo.findOne({
      where: {
        quizId,
        userId,
        status: 'in-progress',
      },
    });
  }

  async findByQuizAndUser(
    quizId: string,
    userId: number,
  ): Promise<QuizAttempt[]> {
    return this.repo.find({
      where: {
        quizId,
        userId,
        status: 'completed',
      },
      order: { createdAt: 'DESC' },
    });
  }

  async findByRoadmapAndUser(
    roadmapId: string,
    userId: number,
  ): Promise<QuizAttempt[]> {
    return this.repo.find({
      where: {
        roadmapId,
        userId,
        status: 'completed',
      },
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: string, updates: Partial<QuizAttempt>): Promise<QuizAttempt> {
    await this.repo.update(id, updates);
    return this.getById(id);
  }

  async save(attempt: QuizAttempt): Promise<QuizAttempt> {
    return this.repo.save(attempt);
  }
}
