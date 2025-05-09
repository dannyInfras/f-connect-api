import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SharedModule } from '@/shared/shared.module';

import { CompanyAclService } from './acl/company.acl';
import { CompanyController } from './controllers/company.controller';
import { Company } from './entities/company.entity';
import { CompanyRepository } from './repositories/company.repository';
import { CompanyService } from './services/company.service';

@Module({
  imports: [
    SharedModule,
    TypeOrmModule.forFeature([Company])
  ],
  controllers: [CompanyController],
  providers: [
    CompanyService,
    CompanyRepository,
    CompanyAclService
  ],
  exports: [CompanyService],
})
export class CompanyModule {}
