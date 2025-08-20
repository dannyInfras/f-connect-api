import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';

import { Bookmark } from '../entities/bookmark.entity';

@Injectable()
export class BookmarkRepository {
  constructor(
    @InjectRepository(Bookmark)
    private readonly repository: Repository<Bookmark>,
  ) {}

  async create(userId: number, jobId: string): Promise<Bookmark> {
    const bookmark = this.repository.create({ userId, jobId });
    return this.repository.save(bookmark);
  }

  async findByUserAndJob(
    userId: number,
    jobId: string,
  ): Promise<Bookmark | null> {
    return this.repository.findOne({
      where: { userId, jobId },
      relations: ['user', 'job'],
    });
  }

  async findByUserId(
    userId: number,
    limit?: number,
    offset?: number,
  ): Promise<(Bookmark & { isApply: boolean })[]> {
    const qb: SelectQueryBuilder<Bookmark> = this.repository
      .createQueryBuilder('bookmark')
      .where('bookmark.userId = :userId', { userId })
      .leftJoinAndSelect('bookmark.job', 'job')
      .leftJoinAndSelect('job.company', 'company')
      .leftJoinAndSelect('job.category', 'category')
      .addSelect(
        (subQ) =>
          subQ
            .select('COUNT(1)')
            .from('job_application', 'ja')
            .where('ja.job_id = job.id')
            .andWhere('ja.user_id = :userId', { userId }),
        'isApplyCount',
      )
      .orderBy('bookmark.createdAt', 'DESC');

    if (typeof limit === 'number') qb.take(limit);
    if (typeof offset === 'number') qb.skip(offset);

    const rows = await qb.getRawAndEntities();

    return rows.entities.map((entity, index) => {
      const raw = rows.raw[index] as any;
      const isApplyCount = Number(raw['isApplyCount'] ?? 0);
      return Object.assign(entity, { isApply: isApplyCount > 0 });
    });
  }

  async findByJobId(jobId: string): Promise<Bookmark[]> {
    return this.repository.find({
      where: { jobId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async remove(userId: number, jobId: string): Promise<boolean> {
    const result = await this.repository.delete({ userId, jobId });
    return (result.affected ?? 0) > 0;
  }

  async removeById(id: number): Promise<boolean> {
    const result = await this.repository.delete({ id });
    return (result.affected ?? 0) > 0;
  }

  async isBookmarked(userId: number, jobId: string): Promise<boolean> {
    const count = await this.repository.count({
      where: { userId, jobId },
    });
    return count > 0;
  }

  async getBookmarkCount(jobId: string): Promise<number> {
    return this.repository.count({
      where: { jobId },
    });
  }
}
