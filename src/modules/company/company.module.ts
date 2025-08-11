import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { JobApplication } from '@/modules/applications/entities/job-application.entity';
import { Job } from '@/modules/jobs/entities/jobs.entity';

import { BenefitAclService } from './acl/benefit.acl';
import { CompanyAclService } from './acl/company.acl';
import { CoreTeamAclService } from './acl/coreteam.acl';
import { BenefitController } from './controllers/benefit.controller';
import { CompanyController } from './controllers/company.controller';
import { CoreTeamController } from './controllers/coreteam.controller';
import { Benefit } from './entities/benefit.entity';
import { Company } from './entities/company.entity';
import { CoreTeam } from './entities/coreteam.entity';
import { BenefitService } from './services/benefit.service';
import { CompanyService } from './services/company.service';
import { CoreTeamService } from './services/core-team.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Company, Benefit, CoreTeam, Job, JobApplication]),
  ],
  controllers: [CompanyController, BenefitController, CoreTeamController],
  providers: [
    CompanyService,
    BenefitService,
    CoreTeamService,
    CompanyAclService,
    BenefitAclService,
    CoreTeamAclService,
  ],
  exports: [CompanyService],
})
export class CompanyModule {}
