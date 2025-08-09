import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CvOptimizationHistory } from '../entities/cv-optimization-history.entity';

@Injectable()
export class CvOptimizationHistoryRepository {
  constructor(
    @InjectRepository(CvOptimizationHistory)
    private readonly repository: Repository<CvOptimizationHistory>,
  ) {}

  async create(
    data: Partial<CvOptimizationHistory>,
  ): Promise<CvOptimizationHistory> {
    const history = this.repository.create(data);
    return this.repository.save(history);
  }

  async findByCvId(cvId: string, limit = 10): Promise<CvOptimizationHistory[]> {
    return this.repository.find({
      where: { cvId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async findByUserId(
    userId: number,
    limit = 10,
  ): Promise<CvOptimizationHistory[]> {
    return this.repository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
      relations: ['cv'],
    });
  }

  async findById(id: string): Promise<CvOptimizationHistory | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['cv', 'user'],
    });
  }

  // async markAsApplied(id: string): Promise<void> {
  //   await this.repository.update(id, { isApplied: true });
  // }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
