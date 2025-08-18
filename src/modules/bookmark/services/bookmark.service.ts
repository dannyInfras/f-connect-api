import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Bookmark } from '../entities/bookmark.entity';
import { BookmarkRepository } from '../repositories/bookmark.repository';

@Injectable()
export class BookmarkService {
  constructor(private readonly bookmarkRepository: BookmarkRepository) {}

  async createBookmark(userId: number, jobId: string): Promise<Bookmark> {
    // Check if bookmark already exists
    const existingBookmark = await this.bookmarkRepository.findByUserAndJob(
      userId,
      jobId,
    );
    if (existingBookmark) {
      throw new ConflictException('Job is already bookmarked');
    }

    return this.bookmarkRepository.create(userId, jobId);
  }

  async removeBookmark(userId: number, jobId: string): Promise<void> {
    const removed = await this.bookmarkRepository.remove(userId, jobId);
    if (!removed) {
      throw new NotFoundException('Bookmark not found');
    }
  }

  async getUserBookmarks(
    userId: number,
    limit?: number,
    offset?: number,
  ): Promise<Bookmark[]> {
    return this.bookmarkRepository.findByUserId(userId, limit, offset);
  }

  async getJobBookmarks(jobId: string): Promise<Bookmark[]> {
    return this.bookmarkRepository.findByJobId(jobId);
  }

  async isJobBookmarked(userId: number, jobId: string): Promise<boolean> {
    return this.bookmarkRepository.isBookmarked(userId, jobId);
  }

  async getJobBookmarkCount(jobId: string): Promise<number> {
    return this.bookmarkRepository.getBookmarkCount(jobId);
  }

  async toggleBookmark(
    userId: number,
    jobId: string,
  ): Promise<{ bookmarked: boolean; message: string }> {
    const isBookmarked = await this.isJobBookmarked(userId, jobId);

    if (isBookmarked) {
      await this.removeBookmark(userId, jobId);
      return { bookmarked: false, message: 'Bookmark removed successfully' };
    } else {
      await this.createBookmark(userId, jobId);
      return { bookmarked: true, message: 'Job bookmarked successfully' };
    }
  }
}
