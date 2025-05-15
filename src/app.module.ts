import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';

import { ArticleModule } from '@/modules/article/article.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { CandidateProfileModule } from '@/modules/candidate-profile/candidate-profile.module';
import { CompanyModule } from '@/modules/company/company.module';
import { EducationModule } from '@/modules/education/education.module';
import { ExperienceModule } from '@/modules/experience/experience.module';
import { JobsModule } from '@/modules/jobs/jobs.module';
import { UserModule } from '@/modules/user/user.module';

import { AppController } from './app.controller';
import { AppService } from './app.service';
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
    SkillModule,
    EducationModule,
    ExperienceModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
