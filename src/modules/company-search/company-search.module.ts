import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Company } from '@/modules/company/entities/company.entity';
import { AppLoggerModule } from '@/shared/logger/logger.module';

import { CompanySearchAclService } from './acl/company-search-acl.service';
import { CompanySearchController } from './controllers/company-search.controller';
import { CompanySearchRepository } from './repositories/company-search.repository';
import { CompanySearchService } from './services/company-search.service';

@Module({
  imports: [TypeOrmModule.forFeature([Company]), AppLoggerModule],
  controllers: [CompanySearchController],
  providers: [
    CompanySearchService,
    CompanySearchAclService,
    CompanySearchRepository,
  ],
  exports: [CompanySearchService, CompanySearchRepository],
})
export class CompanySearchModule {}
