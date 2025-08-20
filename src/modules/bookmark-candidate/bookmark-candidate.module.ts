import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CandidateProfile } from '@/modules/candidate-profile/entities/candidate-profile.entity';
import { Company } from '@/modules/company/entities/company.entity';

import { CandidateBookmarkController } from './controllers/candidate-bookmark.controller';
import { CandidateBookmark } from './entities/candidate-bookmark.entity';
import { CandidateBookmarkRepository } from './repositories/candidate-bookmark.repository';
import { CandidateBookmarkService } from './services/candidate-bookmark.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([CandidateBookmark, Company, CandidateProfile]),
  ],
  controllers: [CandidateBookmarkController],
  providers: [CandidateBookmarkService, CandidateBookmarkRepository],
  exports: [CandidateBookmarkService, CandidateBookmarkRepository],
})
export class BookmarkCandidateModule {}
