import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';

import { ArticleModule } from '@/modules/article/article.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { CandidateProfileModule } from '@/modules/candidate-profile/candidate-profile.module';
import { UserModule } from '@/modules/user/user.module';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RequestLoggerMiddleware } from './shared/middleware/request-logger.middleware';
import { SharedModule } from './shared/shared.module';

@Module({
  imports: [
    SharedModule,
    UserModule,
    AuthModule,
    ArticleModule,
    CandidateProfileModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
