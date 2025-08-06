import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { JwtAuthStrategy } from '@/modules/auth/strategies/jwt-auth.strategy';
import { CandidateProfileController } from '@/modules/candidate-profile/controllers/candidate-profile.controller';
import { CandidateProfile } from '@/modules/candidate-profile/entities/candidate-profile.entity';
import { CandidateProfileRepository } from '@/modules/candidate-profile/repositories/candidate-profile.repository';
import { CandidateProfileService } from '@/modules/candidate-profile/services/candidate-profile.service';
import { CandidateProfileAclService } from '@/modules/candidate-profile/services/candidate-profile-acl.service';
import { CandidateProfileListenerService } from '@/modules/candidate-profile/services/candidate-profile-listener.service';
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
    TypeOrmModule.forFeature([CandidateProfile, User]),
    UserModule,
    SkillModule,
    forwardRef(() => EducationModule),
    forwardRef(() => ExperienceModule),
  ],
  controllers: [
    CandidateProfileController,
    SkillController,
  ],
  providers: [
    // Services
    CandidateProfileService,
    CandidateProfileListenerService,
    // ACL Services
    CandidateProfileAclService,
    // Repositories
    CandidateProfileRepository,
    // Auth
    JwtAuthStrategy,
  ],
  exports: [CandidateProfileService],
})
export class CandidateProfileModule {}
