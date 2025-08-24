import { Controller, Get, Query, ValidationPipe } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

import { UserAccessTokenClaims } from '@/modules/auth/dtos/auth-token-output.dto';
import { ReqContext } from '@/shared/request-context/req-context.decorator';
import { RequestContext } from '@/shared/request-context/request-context.dto';

import { CompanySearchDto } from '../dtos/company-search-input.dto';
import { CompanySearchResponseDto } from '../dtos/company-search-output.dto';
import { CompanySearchSuggestionsResponseDto } from '../dtos/company-search-suggestions-output.dto';
import { CompanySearchService } from '../services/company-search.service';

@ApiTags('Company Search')
@Controller('company-search')
export class CompanySearchController {
  constructor(private readonly companySearchService: CompanySearchService) {}

  @Get('search')
  @ApiOperation({
    summary: 'Search companies with filters',
    description:
      'Search companies by text query and filter by industry. Supports pagination.',
  })
  @ApiQuery({ name: 'q', required: false, description: 'Text query' })
  @ApiQuery({
    name: 'industry',
    required: false,
    description: 'Filter by industry (exact match)',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10, max: 100)',
  })
  @ApiResponse({
    status: 200,
    description: 'Company search results',
    type: CompanySearchResponseDto,
  })
  async searchCompanies(
    @Query(new ValidationPipe({ transform: true })) dto: CompanySearchDto,
    @ReqContext() ctx: RequestContext,
  ): Promise<CompanySearchResponseDto> {
    const user = ctx.user as UserAccessTokenClaims | undefined;
    return this.companySearchService.searchCompaniesWithPermissions({
      dto,
      user,
    });
  }

  @Get('suggestions')
  @ApiOperation({ summary: 'Get company search suggestions' })
  @ApiQuery({ name: 'q', required: true, description: 'Query (min 2 chars)' })
  @ApiResponse({
    status: 200,
    description: 'Suggestions',
    type: CompanySearchSuggestionsResponseDto,
  })
  async getSuggestions(
    @Query('q') q: string,
    @ReqContext() ctx: RequestContext,
  ): Promise<CompanySearchSuggestionsResponseDto> {
    const user = ctx.user as UserAccessTokenClaims | undefined;
    const result =
      await this.companySearchService.getCompanySuggestionsWithPermissions({
        query: q,
        user,
      });
    return result;
  }

  @Get('industries')
  @ApiOperation({ summary: 'List all industries' })
  @ApiResponse({
    status: 200,
    description: 'Distinct industries',
    type: [String],
  })
  async listIndustries(): Promise<string[]> {
    return this.companySearchService.listIndustries();
  }
}
