import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';

import { CandidateBookmark } from '../entities/candidate-bookmark.entity';

@Injectable()
export class CandidateBookmarkRepository {
  constructor(
    @InjectRepository(CandidateBookmark)
    private readonly repository: Repository<CandidateBookmark>,
  ) {}

  async createOne(
    companyId: string,
    candidateProfileId: string,
  ): Promise<CandidateBookmark> {
    const bookmark = this.repository.create({ companyId, candidateProfileId });
    return this.repository.save(bookmark);
  }

  async findByCompanyAndCandidate(
    companyId: string,
    candidateProfileId: string,
  ): Promise<CandidateBookmark | null> {
    return this.repository.findOne({
      where: { companyId, candidateProfileId },
      relations: ['company', 'candidateProfile'],
    });
  }

  async findByCompanyId(
    companyId: string,
    limit?: number,
    offset?: number,
  ): Promise<CandidateBookmark[]> {
    const qb: SelectQueryBuilder<CandidateBookmark> = this.repository
      .createQueryBuilder('cb')
      .where('cb.companyId = :companyId', { companyId })
      .leftJoinAndSelect('cb.candidateProfile', 'candidateProfile')
      .leftJoinAndSelect('candidateProfile.user', 'user')
      .orderBy('cb.createdAt', 'DESC');

    if (typeof limit === 'number') qb.take(limit);
    if (typeof offset === 'number') qb.skip(offset);

    return qb.getMany();
  }

  async remove(
    companyId: string,
    candidateProfileId: string,
  ): Promise<boolean> {
    const result = await this.repository.delete({
      companyId,
      candidateProfileId,
    });
    return (result.affected ?? 0) > 0;
  }

  async isBookmarked(
    companyId: string,
    candidateProfileId: string,
  ): Promise<boolean> {
    const count = await this.repository.count({
      where: { companyId, candidateProfileId },
    });
    return count > 0;
  }
}
