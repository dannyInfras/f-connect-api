import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppLoggerModule } from '@/shared/logger/logger.module';

import { SkillController } from './controllers/skill.controller';
import { Skill } from './entities/skill.entity';
import { SkillRepository } from './repositories/skill.repository';
import { SkillService } from './services/skill.service';
import { SkillAclService } from './services/skill-acl.service';

@Module({
  imports: [TypeOrmModule.forFeature([Skill]), AppLoggerModule],
  controllers: [SkillController],
  providers: [SkillService, SkillAclService, SkillRepository],
  exports: [SkillService],
})
export class SkillModule {}
