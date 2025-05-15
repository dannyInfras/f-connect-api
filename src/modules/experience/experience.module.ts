import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { JwtAuthStrategy } from '@/modules/auth/strategies/jwt-auth.strategy';
import { CandidateProfileModule } from '@/modules/candidate-profile/candidate-profile.module';
import { CandidateProfile } from '@/modules/candidate-profile/entities/candidate-profile.entity';
import { User } from '@/modules/user/entities/user.entity';
import { UserModule } from '@/modules/user/user.module';
import { SharedModule } from '@/shared/shared.module';

import { ExperienceController } from './controllers/experience.controller';
import { Experience } from './entities/experience.entity';
import { ExperienceRepository } from './repositories/experience.repository';
import { ExperienceService } from './services/experience.service';
import { ExperienceAclService } from './services/experience-acl.service';

@Module({
  imports: [
    SharedModule,
    TypeOrmModule.forFeature([Experience, User, CandidateProfile]),
    UserModule,
    forwardRef(() => CandidateProfileModule),
  ],
  controllers: [ExperienceController],
  providers: [
    // Services
    ExperienceService,
    // ACL Services
    ExperienceAclService,
    // Repositories
    ExperienceRepository,
    // Auth
    JwtAuthStrategy,
  ],
  exports: [ExperienceService],
})
export class ExperienceModule {}
