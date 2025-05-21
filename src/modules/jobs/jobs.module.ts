import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SharedModule } from '@/shared/shared.module';

import { CategoryModule } from '../category/category.module';
import { SkillModule } from '../skill/skill.module';
import { JobAclService } from './acl/jobs.acl';
import { JobsController } from './controllers/jobs.controller';
import { Job } from './entities/jobs.entity';
import { JobRepository } from './repositories/jobs.repository';
import { JobService } from './services/jobs.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Job]),
    forwardRef(() => CategoryModule),
    SkillModule,
    SharedModule,
  ],
  controllers: [JobsController],
  providers: [JobService, JobRepository, JobAclService],
  exports: [JobService, JobRepository],
})
export class JobsModule {}
