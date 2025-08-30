import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { AdminModule } from '@/modules/admin/admin.module';
import { ApplicationsModule } from '@/modules/applications/applications.module';
import { ArticleModule } from '@/modules/article/article.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { CandidateProfileModule } from '@/modules/candidate-profile/candidate-profile.module';
import { CompanyModule } from '@/modules/company/company.module';
import { CompanySearchModule } from '@/modules/company-search/company-search.module';
import { CouponModule } from '@/modules/coupon/coupon.module';
import { EducationModule } from '@/modules/education/education.module';
import { ExperienceModule } from '@/modules/experience/experience.module';
import { JobSearchModule } from '@/modules/job-search/job-search.module';
import { JobsModule } from '@/modules/jobs/jobs.module';
import { MessengerModule } from '@/modules/messenger/messenger.module';
import { NotificationModule } from '@/modules/notification/notification.module';
import { PackageModule } from '@/modules/package/package.module';
import { PaymentModule } from '@/modules/payment/payment.module';
import { PayosModule } from '@/modules/payos/payos.module';
import { RoadmapModule } from '@/modules/roadmap/roadmap.module';
import { ScheduleModule as ScheduleManagementModule } from '@/modules/schedule/schedule.module';
import { UserModule } from '@/modules/user/user.module';
import { VideoCallModule } from '@/modules/video-call/video-call.module';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AiQuizModule } from './modules/ai-quiz/ai-quiz.module';
import { BookmarkModule } from './modules/bookmark/bookmark.module';
import { BookmarkCandidateModule } from './modules/bookmark-candidate/bookmark-candidate.module';
import { CvModule } from './modules/cv/cv.module';
import { ReportModule } from './modules/report/report.module';
import { RoomModule } from './modules/room/room.module';
import { SkillModule } from './modules/skill/skill.module';
import { RequestLoggerMiddleware } from './shared/middleware/request-logger.middleware';
import { SharedModule } from './shared/shared.module';

@Module({
  imports: [
    SharedModule,
    ScheduleModule.forRoot(),
    UserModule,
    AuthModule,
    AdminModule,
    ArticleModule,
    CandidateProfileModule,
    CompanyModule,
    JobsModule,
    JobSearchModule,
    CompanySearchModule,
    SkillModule,
    EducationModule,
    ExperienceModule,
    CvModule,
    ApplicationsModule,
    NotificationModule,
    VideoCallModule,
    PayosModule,
    PaymentModule,
    PackageModule,
    RoomModule,
    RoadmapModule,
    MessengerModule,
    CouponModule,
    ScheduleManagementModule,
    AiQuizModule,
    BookmarkModule,
    BookmarkCandidateModule,
    ReportModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
