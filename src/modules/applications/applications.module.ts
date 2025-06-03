import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SharedModule } from '../../shared/shared.module';
import { JwtAuthStrategy } from '../auth/strategies/jwt-auth.strategy';
import { Job } from '../jobs/entities/jobs.entity';
import { JobsModule } from '../jobs/jobs.module';
import { User } from '../user/entities/user.entity';
import { UserModule } from '../user/user.module';
import { JobApplicationAclService } from './acl/job-application-acl.service';
import { JobApplicationController } from './controllers/job-application.controller';
import { JobApplication } from './entities/job-application.entity';
import { JobApplicationRepository } from './repositories/job-application.repository';
import { JobApplicationService } from './services/job-application.service';

@Module({
  imports: [
    SharedModule,
    TypeOrmModule.forFeature([JobApplication, User, Job]),
    UserModule,
    forwardRef(() => JobsModule),
  ],
  controllers: [JobApplicationController],
  providers: [
    // Services
    JobApplicationService,
    // ACL Services
    JobApplicationAclService,
    // Repositories
    JobApplicationRepository,
    // Auth
    JwtAuthStrategy,
  ],
  exports: [JobApplicationService],
})
export class ApplicationsModule {}
