import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { JwtAuthStrategy } from '@/modules/auth/strategies/jwt-auth.strategy';
import { CandidateProfileController } from '@/modules/candidate-profile/controllers/candidate-profile.controller';
import { CandidateSkillController } from '@/modules/candidate-profile/controllers/candidate-skill.controller';
import { ExperienceController } from '@/modules/candidate-profile/controllers/experience.controller';
import { SkillController } from '@/modules/candidate-profile/controllers/skill.controller';
import { CandidateProfile } from '@/modules/candidate-profile/entities/candidate-profile.entity';
import { CandidateSkill } from '@/modules/candidate-profile/entities/candidate-skill.entity';
import { Experience } from '@/modules/candidate-profile/entities/experience.entity';
import { Skill } from '@/modules/candidate-profile/entities/skill.entity';
import { CandidateProfileRepository } from '@/modules/candidate-profile/repositories/candidate-profile.repository';
import { CandidateSkillRepository } from '@/modules/candidate-profile/repositories/candidate-skill.repository';
import { ExperienceRepository } from '@/modules/candidate-profile/repositories/experience.repository';
import { SkillRepository } from '@/modules/candidate-profile/repositories/skill.repository';
import { CandidateProfileService } from '@/modules/candidate-profile/services/candidate-profile.service';
import { CandidateProfileAclService } from '@/modules/candidate-profile/services/candidate-profile-acl.service';
import { CandidateProfileListenerService } from '@/modules/candidate-profile/services/candidate-profile-listener.service';
import { CandidateSkillService } from '@/modules/candidate-profile/services/candidate-skill.service';
import { CandidateSkillAclService } from '@/modules/candidate-profile/services/candidate-skill-acl.service';
import { ExperienceService } from '@/modules/candidate-profile/services/experience.service';
import { ExperienceAclService } from '@/modules/candidate-profile/services/experience-acl.service';
import { SkillService } from '@/modules/candidate-profile/services/skill.service';
import { SkillAclService } from '@/modules/candidate-profile/services/skill-acl.service';
import { UserModule } from '@/modules/user/user.module';
import { SharedModule } from '@/shared/shared.module';

@Module({
  imports: [
    SharedModule,
    TypeOrmModule.forFeature([
      CandidateProfile,
      Experience,
      Skill,
      CandidateSkill,
    ]),
    UserModule,
  ],
  controllers: [
    CandidateProfileController,
    ExperienceController,
    SkillController,
    CandidateSkillController,
  ],
  providers: [
    // Services
    CandidateProfileService,
    ExperienceService,
    SkillService,
    CandidateSkillService,
    CandidateProfileListenerService,
    // ACL Services
    CandidateProfileAclService,
    ExperienceAclService,
    SkillAclService,
    CandidateSkillAclService,
    // Repositories
    CandidateProfileRepository,
    ExperienceRepository,
    SkillRepository,
    CandidateSkillRepository,
    // Auth
    JwtAuthStrategy,
  ],
  exports: [CandidateProfileService],
})
export class CandidateProfileModule {}
