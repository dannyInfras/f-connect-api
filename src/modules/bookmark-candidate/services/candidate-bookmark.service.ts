import { ConflictException, Injectable } from '@nestjs/common';

import { CandidateBookmark } from '../entities/candidate-bookmark.entity';
import { CandidateBookmarkRepository } from '../repositories/candidate-bookmark.repository';

@Injectable()
export class CandidateBookmarkService {
  constructor(private readonly repository: CandidateBookmarkRepository) {}

  async toggle(
    companyId: string,
    candidateProfileId: string,
  ): Promise<{ bookmarked: boolean; message: string }> {
    const isBookmarked = await this.repository.isBookmarked(
      companyId,
      candidateProfileId,
    );
    if (isBookmarked) {
      await this.repository.remove(companyId, candidateProfileId);
      return {
        bookmarked: false,
        message: 'Candidate unbookmarked successfully',
      };
    }

    await this.repository.createOne(companyId, candidateProfileId);
    return { bookmarked: true, message: 'Candidate bookmarked successfully' };
  }

  async create(
    companyId: string,
    candidateProfileId: string,
  ): Promise<CandidateBookmark> {
    const existing = await this.repository.findByCompanyAndCandidate(
      companyId,
      candidateProfileId,
    );
    if (existing) {
      throw new ConflictException('Candidate already bookmarked');
    }
    return this.repository.createOne(companyId, candidateProfileId);
  }

  async list(
    companyId: string,
    limit?: number,
    offset?: number,
  ): Promise<CandidateBookmark[]> {
    return this.repository.findByCompanyId(companyId, limit, offset);
  }

  async check(companyId: string, candidateProfileId: string): Promise<boolean> {
    return this.repository.isBookmarked(companyId, candidateProfileId);
  }
}
