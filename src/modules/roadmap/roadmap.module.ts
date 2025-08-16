import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CvModule } from '../cv/cv.module';
import { JobsModule } from '../jobs/jobs.module';
import { UserModule } from '../user/user.module';
import { RoadmapAclService } from './acl/roadmap.acl';
import { RoadmapController } from './controllers/roadmap.controller';
import { Roadmap } from './entities/roadmap.entity';
import { RoadmapRepository } from './repositories/roadmap.repository';
import { RoadmapService } from './services/roadmap.service';
import { RoadmapAiService } from './services/roadmap-ai.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Roadmap]),
    CvModule,
    JobsModule,
    ConfigModule,
    UserModule,
  ],
  controllers: [RoadmapController],
  providers: [
    RoadmapService,
    RoadmapAiService,
    RoadmapRepository,
    RoadmapAclService,
  ],
  exports: [RoadmapService],
})
export class RoadmapModule {}
