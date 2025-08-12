import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Quiz } from '../entities/quiz.entity';

@Injectable()
export class QuizRepository {
  constructor(
    @InjectRepository(Quiz)
    private readonly repo: Repository<Quiz>,
  ) {}

  async create(quiz: Partial<Quiz>): Promise<Quiz> {
    const entity = this.repo.create(quiz);
    return this.repo.save(entity);
  }

  async findById(id: string): Promise<Quiz | null> {
    return this.repo.findOne({ where: { id } });
  }

  async getById(id: string): Promise<Quiz> {
    const quiz = await this.findById(id);
    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }
    return quiz;
  }

  async findByRoadmapAndUser(
    roadmapId: string,
    userId: number,
  ): Promise<Quiz | null> {
    return this.repo.findOne({
      where: {
        roadmapId,
        userId,
        status: 'published',
      },
      order: { createdAt: 'DESC' },
    });
  }

  async findByUserId(
    userId: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: Quiz[]; total: number }> {
    const skip = (page - 1) * limit;
    
    const [data, total] = await this.repo.findAndCount({
      where: { userId },
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return { data, total };
  }

  async update(id: string, updates: Partial<Quiz>): Promise<Quiz> {
    await this.repo.update(id, updates);
    return this.getById(id);
  }

  async archiveExisting(roadmapId: string, userId: number): Promise<void> {
    await this.repo.update(
      { roadmapId, userId, status: 'published' },
      { status: 'archived' },
    );
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
