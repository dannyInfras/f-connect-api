import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ArticleController } from '@/modules/article/controllers/article.controller';
import { Article } from '@/modules/article/entities/article.entity';
import { ArticleRepository } from '@/modules/article/repositories/article.repository';
import { ArticleService } from '@/modules/article/services/article.service';
import { ArticleAclService } from '@/modules/article/services/article-acl.service';
import { JwtAuthStrategy } from '@/modules/auth/strategies/jwt-auth.strategy';
import { UserModule } from '@/modules/user/user.module';
import { SharedModule } from '@/shared/shared.module';

@Module({
  imports: [SharedModule, TypeOrmModule.forFeature([Article]), UserModule],
  providers: [
    ArticleService,
    JwtAuthStrategy,
    ArticleAclService,
    ArticleRepository,
  ],
  controllers: [ArticleController],
  exports: [ArticleService],
})
export class ArticleModule {}
