import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { JwtAuthStrategy } from '@/modules/auth/strategies/jwt-auth.strategy';
import { CandidateProfileController } from '@/modules/candidate-profile/controllers/candidate-profile.controller';
import { CandidateSkillController } from '@/modules/candidate-profile/controllers/candidate-skill.controller';
import { CandidateProfile } from '@/modules/candidate-profile/entities/candidate-profile.entity';
import { CandidateSkill } from '@/modules/candidate-profile/entities/candidate-skill.entity';
import { CandidateProfileRepository } from '@/modules/candidate-profile/repositories/candidate-profile.repository';
import { CandidateSkillRepository } from '@/modules/candidate-profile/repositories/candidate-skill.repository';
import { CandidateProfileService } from '@/modules/candidate-profile/services/candidate-profile.service';
import { CandidateProfileAclService } from '@/modules/candidate-profile/services/candidate-profile-acl.service';
import { CandidateProfileListenerService } from '@/modules/candidate-profile/services/candidate-profile-listener.service';
import { CandidateSkillService } from '@/modules/candidate-profile/services/candidate-skill.service';
import { CandidateSkillAclService } from '@/modules/candidate-profile/services/candidate-skill-acl.service';
import { EducationModule } from '@/modules/education/education.module';
import { ExperienceModule } from '@/modules/experience/experience.module';
import { SkillController } from '@/modules/skill/controllers/skill.controller';
import { User } from '@/modules/user/entities/user.entity';
import { UserModule } from '@/modules/user/user.module';
import { SharedModule } from '@/shared/shared.module';

import { SkillModule } from '../skill/skill.module';
@Module({
  imports: [
    SharedModule,
    TypeOrmModule.forFeature([CandidateProfile, CandidateSkill, User]),
    UserModule,
    SkillModule,
    forwardRef(() => EducationModule),
    forwardRef(() => ExperienceModule),
  ],
  controllers: [
    CandidateProfileController,
    SkillController,
    CandidateSkillController,
  ],
  providers: [
    // Services
    CandidateProfileService,
    CandidateSkillService,
    CandidateProfileListenerService,
    // ACL Services
    CandidateProfileAclService,
    CandidateSkillAclService,
    // Repositories
    CandidateProfileRepository,
    CandidateSkillRepository,
    // Auth
    JwtAuthStrategy,
  ],
  exports: [CandidateProfileService],
})
export class CandidateProfileModule {}
