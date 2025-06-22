import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { JobApplication } from '@/modules/applications/entities/job-application.entity';
import { Category } from '@/modules/category/entities/category.entity';
import { Company } from '@/modules/company/entities/company.entity';
import { Job } from '@/modules/jobs/entities/jobs.entity';
import { AppLoggerModule } from '@/shared/logger/logger.module';

import { JobSearchAclService } from './acl/job-search-acl.service';
import { JobSearchController } from './controllers/job-search.controller';
import { JobSearchRepository } from './repositories/job-search.repository';
import { JobSearchService } from './services/job-search.service';

/**
 * Job Search Module
 *
 * Provides advanced job search functionality with:
 * - Full-text search using PostgreSQL tsvector
 * - Comprehensive filtering options
 * - Pagination and sorting
 * - Application statistics
 * - Search suggestions and autocomplete
 * - Role-based access control
 *
 * @module JobSearchModule
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Job, JobApplication, Company, Category]),
    AppLoggerModule,
  ],
  controllers: [JobSearchController],
  providers: [
    // Services
    JobSearchService,
    // ACL Services
    JobSearchAclService,
    // Repositories
    JobSearchRepository,
  ],
  exports: [JobSearchService, JobSearchRepository],
})
export class JobSearchModule {}
