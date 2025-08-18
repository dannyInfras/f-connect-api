import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';

import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { User } from '@/modules/user/entities/user.entity';
import { GetUser } from '@/shared/decorators/get-user.decorator';
import { BaseApiErrorResponse } from '@/shared/dtos/base-api-response.dto';
import { PaginationParamsDto } from '@/shared/dtos/pagination-params.dto';

import {
  BookmarkResponseDto,
  ToggleBookmarkResponseDto,
} from '../dtos/bookmark-response.dto';
import { BookmarkService } from '../services/bookmark.service';

@ApiTags('bookmarks')
@ApiBearerAuth()
@Controller('bookmarks')
@UseGuards(JwtAuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class BookmarkController {
  constructor(private readonly bookmarkService: BookmarkService) {}

  @Post('toggle/:jobId')
  @ApiOperation({ summary: 'Toggle bookmark for a job' })
  @ApiResponse({ status: 200, type: ToggleBookmarkResponseDto })
  @ApiResponse({ status: 401, type: BaseApiErrorResponse })
  async toggleBookmark(
    @Param('jobId') jobId: string,
    @GetUser() user: User,
  ): Promise<ToggleBookmarkResponseDto> {
    const result = await this.bookmarkService.toggleBookmark(user.id, jobId);
    return plainToInstance(ToggleBookmarkResponseDto, result, {
      excludeExtraneousValues: true,
    });
  }

  @Get('my-bookmarks')
  @ApiOperation({ summary: 'Get my bookmarked jobs' })
  @ApiResponse({ status: 200, type: [BookmarkResponseDto] })
  @ApiResponse({ status: 401, type: BaseApiErrorResponse })
  async getUserBookmarks(
    @GetUser() user: User,
    @Query() query?: PaginationParamsDto,
  ): Promise<BookmarkResponseDto[]> {
    const limit = query?.limit;
    const offset = query?.offset;
    const bookmarks = await this.bookmarkService.getUserBookmarks(
      user.id,
      limit,
      offset,
    );
    return plainToInstance(BookmarkResponseDto, bookmarks, {
      excludeExtraneousValues: true,
    });
  }

  @Get('check/:jobId')
  @ApiOperation({ summary: 'Check if a job is bookmarked by current user' })
  @ApiResponse({
    status: 200,
    description: 'Bookmark status',
    schema: {
      type: 'object',
      properties: { bookmarked: { type: 'boolean' } },
    },
  })
  @ApiResponse({ status: 401, type: BaseApiErrorResponse })
  async checkBookmark(
    @Param('jobId') jobId: string,
    @GetUser() user: User,
  ): Promise<{ bookmarked: boolean }> {
    const bookmarked = await this.bookmarkService.isJobBookmarked(
      user.id,
      jobId,
    );
    return { bookmarked };
  }
}
