import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SharedModule } from '@/shared/shared.module';

import { CategoryAclService } from './acl/category.acl';
import { CategoryController } from './controllers/category.controller';
import { Category } from './entities/category.entity';
import { CategoryRepository } from './repositories/category.repository';
import { CategoryService } from './services/category.service';

@Module({
  imports: [TypeOrmModule.forFeature([Category]), SharedModule],
  controllers: [CategoryController],
  providers: [CategoryService, CategoryRepository, CategoryAclService],
  exports: [CategoryService, CategoryRepository],
})
export class CategoryModule {}
