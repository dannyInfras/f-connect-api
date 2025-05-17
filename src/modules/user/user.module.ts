import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { JwtAuthStrategy } from '@/modules/auth/strategies/jwt-auth.strategy';
import { CompanyRepository } from '@/modules/company/repositories/company.repository';
import { UserController } from '@/modules/user/controllers/user.controller';
import { User } from '@/modules/user/entities/user.entity';
import { UserRepository } from '@/modules/user/repositories/user.repository';
import { UserService } from '@/modules/user/services/user.service';
import { UserAclService } from '@/modules/user/services/user-acl.service';
import { SharedModule } from '@/shared/shared.module';

@Module({
  imports: [SharedModule, TypeOrmModule.forFeature([User])],
  providers: [
    UserService,
    JwtAuthStrategy,
    UserAclService,
    UserRepository,
    CompanyRepository,
  ],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
