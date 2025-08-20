import {
  ClassSerializerInterceptor,
  Controller,
  ForbiddenException,
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
import { PaginationParamsDto } from '@/shared/dtos/pagination-params.dto';
import { ReqContext } from '@/shared/request-context/req-context.decorator';
import { RequestContext } from '@/shared/request-context/request-context.dto';

import {
  CandidateBookmarkResponseDto,
  ToggleCandidateBookmarkResponseDto,
} from '../dtos/candidate-bookmark.dto';
import { CandidateBookmarkService } from '../services/candidate-bookmark.service';

@ApiTags('bookmark-candidate')
@ApiBearerAuth()
@Controller('bookmark-candidates')
@UseGuards(JwtAuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class CandidateBookmarkController {
  constructor(private readonly service: CandidateBookmarkService) {}

  @Post('toggle/:candidateProfileId')
  @ApiOperation({ summary: 'Toggle bookmark for a candidate profile' })
  @ApiResponse({ status: 200, type: ToggleCandidateBookmarkResponseDto })
  async toggle(
    @Param('candidateProfileId') candidateProfileId: string,
    @ReqContext() ctx: RequestContext,
  ): Promise<ToggleCandidateBookmarkResponseDto> {
    const companyId = ctx.user?.companyId ? String(ctx.user.companyId) : '';
    if (!companyId) {
      throw new ForbiddenException('Company account required');
    }
    const result = await this.service.toggle(companyId, candidateProfileId);
    return plainToInstance(ToggleCandidateBookmarkResponseDto, result, {
      excludeExtraneousValues: true,
    });
  }

  @Get()
  @ApiOperation({ summary: 'List bookmarked candidates for a company' })
  @ApiResponse({ status: 200, type: [CandidateBookmarkResponseDto] })
  async list(
    @Query() query?: PaginationParamsDto,
    @ReqContext() ctx?: RequestContext,
  ): Promise<CandidateBookmarkResponseDto[]> {
    const companyId = ctx?.user?.companyId ? String(ctx.user.companyId) : '';
    if (!companyId) {
      throw new ForbiddenException('Company account required');
    }
    const bookmarks = await this.service.list(
      companyId,
      query?.limit,
      query?.offset,
    );
    return plainToInstance(CandidateBookmarkResponseDto, bookmarks, {
      excludeExtraneousValues: true,
    });
  }

  @Get('check/:candidateProfileId')
  @ApiOperation({ summary: 'Check if a candidate is bookmarked by company' })
  @ApiResponse({
    status: 200,
    schema: { type: 'object', properties: { bookmarked: { type: 'boolean' } } },
  })
  async check(
    @Param('candidateProfileId') candidateProfileId: string,
    @ReqContext() ctx: RequestContext,
  ): Promise<{ bookmarked: boolean }> {
    const companyId = ctx.user?.companyId ? String(ctx.user.companyId) : '';
    if (!companyId) {
      throw new ForbiddenException('Company account required');
    }
    const bookmarked = await this.service.check(companyId, candidateProfileId);
    return { bookmarked };
  }
}
