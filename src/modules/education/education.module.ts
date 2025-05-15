import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { JwtAuthStrategy } from '@/modules/auth/strategies/jwt-auth.strategy';
import { CandidateProfileModule } from '@/modules/candidate-profile/candidate-profile.module';
import { CandidateProfile } from '@/modules/candidate-profile/entities/candidate-profile.entity';
import { EducationAclService } from '@/modules/education/services/education-acl.service';
import { User } from '@/modules/user/entities/user.entity';
import { UserModule } from '@/modules/user/user.module';
import { SharedModule } from '@/shared/shared.module';

import { EducationController } from './controllers/education.controller';
import { Education } from './entities/education.entity';
import { EducationRepository } from './repositories/education.repository';
import { EducationService } from './services/education.service';

@Module({
  imports: [
    SharedModule,
    TypeOrmModule.forFeature([Education, User, CandidateProfile]),
    UserModule,
    forwardRef(() => CandidateProfileModule),
  ],
  controllers: [EducationController],
  providers: [
    // Services
    EducationService,
    // ACL Services
    EducationAclService,
    // Repositories
    EducationRepository,
    // Auth
    JwtAuthStrategy,
  ],
  exports: [EducationService],
})
export class EducationModule {}
