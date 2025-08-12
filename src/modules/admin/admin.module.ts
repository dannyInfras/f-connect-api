import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { JobApplication } from '@/modules/applications/entities/job-application.entity';
import { Category } from '@/modules/category/entities/category.entity';
import { Company } from '@/modules/company/entities/company.entity';
import { Job } from '@/modules/jobs/entities/jobs.entity';
import { Notification } from '@/modules/notification/entities/notification.entity';
import { Skill } from '@/modules/skill/entities/skill.entity';
import { User } from '@/modules/user/entities/user.entity';
import { UserModule } from '@/modules/user/user.module';
import { SharedModule } from '@/shared/shared.module';

import { ANALYTICS_REPOSITORY_TOKENS } from './constants/analytics-tokens';
import { AdminAnalyticsController } from './controllers/admin-analytics.controller';
import { AdminCompanyController } from './controllers/admin-company.controller';
import { AdminUserController } from './controllers/admin-user.controller';
import { AdminApplicationAnalyticsRepository } from './repositories/admin-application-analytics.repository';
import { AdminCompanyAnalyticsRepository } from './repositories/admin-company-analytics.repository';
import { AdminDashboardAnalyticsRepository } from './repositories/admin-dashboard-analytics.repository';
import { AdminJobAnalyticsRepository } from './repositories/admin-job-analytics.repository';
import { AdminUserAnalyticsRepository } from './repositories/admin-user-analytics.repository';
import { AdminAnalyticsService } from './services/admin-analytics.service';
import { AdminAnalyticsAclService } from './services/admin-analytics-acl.service';
import { AdminCompanyService } from './services/admin-company.service';
import { AdminCompanyAclService } from './services/admin-company-acl.service';
import { AdminUserService } from './services/admin-user.service';
import { AdminUserAclService } from './services/admin-user-acl.service';

@Module({
  imports: [
    SharedModule,
    UserModule,
    TypeOrmModule.forFeature([
      User,
      Job,
      JobApplication,
      Company,
      Category,
      Skill,
      Notification,
    ]),
  ],
  providers: [
    // User management services
    AdminUserService,
    AdminUserAclService,
    AdminCompanyService,
    AdminCompanyAclService,

    // Analytics services
    AdminAnalyticsService,
    AdminAnalyticsAclService,

    // Analytics repositories with interface bindings
    {
      provide: ANALYTICS_REPOSITORY_TOKENS.DASHBOARD_ANALYTICS_REPOSITORY,
      useClass: AdminDashboardAnalyticsRepository,
    },
    {
      provide: ANALYTICS_REPOSITORY_TOKENS.USER_ANALYTICS_REPOSITORY,
      useClass: AdminUserAnalyticsRepository,
    },
    {
      provide: ANALYTICS_REPOSITORY_TOKENS.JOB_ANALYTICS_REPOSITORY,
      useClass: AdminJobAnalyticsRepository,
    },
    {
      provide: ANALYTICS_REPOSITORY_TOKENS.APPLICATION_ANALYTICS_REPOSITORY,
      useClass: AdminApplicationAnalyticsRepository,
    },
    {
      provide: ANALYTICS_REPOSITORY_TOKENS.COMPANY_ANALYTICS_REPOSITORY,
      useClass: AdminCompanyAnalyticsRepository,
    },

    // Concrete repository implementations (for potential direct usage)
    AdminDashboardAnalyticsRepository,
    AdminUserAnalyticsRepository,
    AdminJobAnalyticsRepository,
    AdminApplicationAnalyticsRepository,
    AdminCompanyAnalyticsRepository,
  ],
  controllers: [
    AdminUserController,
    AdminAnalyticsController,
    AdminCompanyController,
  ],
  exports: [
    AdminUserService,
    AdminAnalyticsService,

    // Export repositories for potential use in other modules
    ANALYTICS_REPOSITORY_TOKENS.DASHBOARD_ANALYTICS_REPOSITORY,
    ANALYTICS_REPOSITORY_TOKENS.USER_ANALYTICS_REPOSITORY,
    ANALYTICS_REPOSITORY_TOKENS.JOB_ANALYTICS_REPOSITORY,
    ANALYTICS_REPOSITORY_TOKENS.APPLICATION_ANALYTICS_REPOSITORY,
    ANALYTICS_REPOSITORY_TOKENS.COMPANY_ANALYTICS_REPOSITORY,
  ],
})
export class AdminModule {}
