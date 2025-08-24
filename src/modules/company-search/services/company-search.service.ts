import { Injectable } from '@nestjs/common';

import { UserAccessTokenClaims } from '@/modules/auth/dtos/auth-token-output.dto';
import { AppLogger } from '@/shared/logger/logger.service';

import { CompanySearchAclService } from '../acl/company-search-acl.service';
import { CompanySearchDto } from '../dtos/company-search-input.dto';
import { CompanySearchResponseDto } from '../dtos/company-search-output.dto';
import { CompanySearchSuggestionsResponseDto } from '../dtos/company-search-suggestions-output.dto';
import { CompanySearchRepository } from '../repositories/company-search.repository';

@Injectable()
export class CompanySearchService {
  constructor(
    private readonly repo: CompanySearchRepository,
    private readonly aclService: CompanySearchAclService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(CompanySearchService.name);
  }

  async searchCompanies(params: {
    dto: CompanySearchDto;
    user: UserAccessTokenClaims | undefined;
  }): Promise<CompanySearchResponseDto> {
    const { dto } = params;

    // Public API: allow unauthenticated users. If you need role-based restrictions later,
    // add checks here when a user is present.

    const page = dto.page || 1;
    const limit = dto.limit || 10;

    const result = await this.repo.searchCompanies({
      query: dto.q,
      industry: dto.industry,
      page,
      limit,
    });

    const totalPages = Math.ceil(result.totalCount / limit) || 1;

    return {
      data: result.companies.map((c) => ({
        id: c.id,
        companyName: c.companyName,
        logoUrl: c.logoUrl,
        industry: c.industry,
      })),
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: result.totalCount,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async getCompanySuggestions(params: {
    query: string;
    limit?: number;
    user: UserAccessTokenClaims | undefined;
  }): Promise<CompanySearchSuggestionsResponseDto> {
    const { query, limit = 5 } = params;

    // Public API: allow unauthenticated users.

    if (!query?.trim() || query.trim().length < 2) {
      return { keywords: [], companies: [] };
    }

    const result = await this.repo.getCompanySuggestions({
      query: query.trim(),
      limit,
    });
    return {
      keywords: result.keywords,
      companies: result.companies.map((c) => ({
        id: c.id,
        name: c.companyName,
        logoUrl: c.logoUrl,
        industry: c.industry,
      })),
    };
  }

  async searchCompaniesWithPermissions(params: {
    dto: CompanySearchDto;
    user: UserAccessTokenClaims | undefined;
  }): Promise<CompanySearchResponseDto> {
    return this.searchCompanies(params);
  }

  async getCompanySuggestionsWithPermissions(params: {
    query: string;
    limit?: number;
    user: UserAccessTokenClaims | undefined;
  }): Promise<CompanySearchSuggestionsResponseDto> {
    return this.getCompanySuggestions(params);
  }

  async listIndustries(): Promise<string[]> {
    return this.repo.listIndustries();
  }
}
