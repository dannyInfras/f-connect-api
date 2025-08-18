import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BookmarkController } from './controllers/bookmark.controller';
import { Bookmark } from './entities/bookmark.entity';
import { BookmarkRepository } from './repositories/bookmark.repository';
import { BookmarkService } from './services/bookmark.service';

@Module({
  imports: [TypeOrmModule.forFeature([Bookmark])],
  controllers: [BookmarkController],
  providers: [BookmarkService, BookmarkRepository],
  exports: [BookmarkService, BookmarkRepository],
})
export class BookmarkModule {}
