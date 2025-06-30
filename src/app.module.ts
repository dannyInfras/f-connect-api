import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';

import { ApplicationsModule } from '@/modules/applications/applications.module';
import { ArticleModule } from '@/modules/article/article.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { CandidateProfileModule } from '@/modules/candidate-profile/candidate-profile.module';
import { CompanyModule } from '@/modules/company/company.module';
import { EducationModule } from '@/modules/education/education.module';
import { ExperienceModule } from '@/modules/experience/experience.module';
import { JobSearchModule } from '@/modules/job-search/job-search.module';
import { JobsModule } from '@/modules/jobs/jobs.module';
import { PackageModule } from '@/modules/package/package.module';
import { PayosModule } from '@/modules/payos/payos.module';
import { UserModule } from '@/modules/user/user.module';
import { VideoCallModule } from '@/modules/video-call/video-call.module';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CvModule } from './modules/cv/cv.module';
import { SkillModule } from './modules/skill/skill.module';
import { RequestLoggerMiddleware } from './shared/middleware/request-logger.middleware';
import { SharedModule } from './shared/shared.module';

@Module({
  imports: [
    SharedModule,
    UserModule,
    AuthModule,
    ArticleModule,
    CandidateProfileModule,
    CompanyModule,
    JobsModule,
    JobSearchModule,
    SkillModule,
    EducationModule,
    ExperienceModule,
    CvModule,
    ApplicationsModule,
    VideoCallModule,
    PayosModule,
    PackageModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
