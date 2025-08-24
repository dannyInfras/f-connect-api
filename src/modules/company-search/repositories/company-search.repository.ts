import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Company } from '@/modules/company/entities/company.entity';

export interface CompanySearchQueryParams {
  query?: string;
  industry?: string;
  page: number;
  limit: number;
}

export interface CompanySearchResultItem {
  id: string;
  companyName: string;
  logoUrl?: string;
  industry?: string;
}

export interface CompanySearchResult {
  companies: CompanySearchResultItem[];
  totalCount: number;
}

export interface CompanySuggestionsParams {
  query: string;
  limit: number;
}

export interface CompanySuggestionsResult {
  keywords: string[];
  companies: CompanySearchResultItem[];
}

@Injectable()
export class CompanySearchRepository {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
  ) {}

  async searchCompanies(
    params: CompanySearchQueryParams,
  ): Promise<CompanySearchResult> {
    const { query, industry, page, limit } = params;

    let qb = this.companyRepo.createQueryBuilder('company');

    if (query) {
      const normalized = query.trim();
      qb = qb.andWhere(
        '(company.companyName ILIKE :q OR company.description ILIKE :q)',
        { q: `%${normalized}%` },
      );
    }

    if (industry) {
      qb = qb.andWhere('company.industry = :industry', { industry });
    }

    // Sort by priority then recent
    qb = qb
      .orderBy('company.priority_position', 'ASC')
      .addOrderBy('company.created_at', 'DESC');

    const offset = (page - 1) * limit;

    const [rows, total] = await qb
      .offset(offset)
      .limit(limit)
      .getManyAndCount();

    const companies: CompanySearchResultItem[] = rows.map((c) => ({
      id: c.id,
      companyName: c.companyName,
      logoUrl: c.logoUrl,
      industry: c.industry,
    }));

    return { companies, totalCount: total };
  }

  async getCompanySuggestions(
    params: CompanySuggestionsParams,
  ): Promise<CompanySuggestionsResult> {
    const { query, limit } = params;
    if (!query?.trim() || query.trim().length < 2) {
      return { keywords: [], companies: [] };
    }

    const q = query.trim();

    const keywordRows = await this.companyRepo
      .createQueryBuilder('company')
      .select('DISTINCT company.companyName', 'value')
      .where('company.companyName ILIKE :q', { q: `%${q}%` })
      .orderBy('company.companyName')
      .limit(limit)
      .getRawMany();

    const keywords = keywordRows.map((r: any) => r.value).slice(0, limit);

    const companiesRaw = await this.companyRepo
      .createQueryBuilder('company')
      .select([
        'company.id',
        'company.companyName',
        'company.logoUrl',
        'company.industry',
      ])
      .where('company.companyName ILIKE :q', { q: `%${q}%` })
      .orderBy('company.priority_position', 'ASC')
      .addOrderBy('company.created_at', 'DESC')
      .limit(limit)
      .getMany();

    const companies: CompanySearchResultItem[] = companiesRaw.map((c) => ({
      id: c.id,
      companyName: c.companyName,
      logoUrl: c.logoUrl,
      industry: c.industry,
    }));

    return { keywords, companies };
  }

  async listIndustries(): Promise<string[]> {
    const rows = await this.companyRepo
      .createQueryBuilder('company')
      .select('DISTINCT company.industry', 'industry')
      .where('company.industry IS NOT NULL AND company.industry <> :empty', {
        empty: '',
      })
      .orderBy('industry', 'ASC')
      .getRawMany();

    return rows.map((r: any) => r.industry);
  }
}
