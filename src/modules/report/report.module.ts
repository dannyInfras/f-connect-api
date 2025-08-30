import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { JobsModule } from '@/modules/jobs/jobs.module';
import { SharedModule } from '@/shared/shared.module';

import { ReportAclService } from './acl/report.acl';
import { ReportController } from './controllers/report.controller';
import { Report } from './entities/report.entity';
import { ReportRepository } from './repositories/report.repository';
import { ReportService } from './services/report.service';

@Module({
  imports: [TypeOrmModule.forFeature([Report]), JobsModule, SharedModule],
  controllers: [ReportController],
  providers: [ReportService, ReportRepository, ReportAclService],
  exports: [ReportService, ReportRepository],
})
export class ReportModule {}
