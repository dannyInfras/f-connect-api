import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { JwtAuthStrategy } from '@/modules/auth/strategies/jwt-auth.strategy';
import { PackageController } from '@/modules/package/controllers/package.controller';
import { Package } from '@/modules/package/entities/package.entity';
import { PackageRepository } from '@/modules/package/repositories/package.repository';
import { PackageService } from '@/modules/package/services/package.service';
import { SharedModule } from '@/shared/shared.module';

@Module({
  imports: [SharedModule, TypeOrmModule.forFeature([Package])],
  providers: [PackageService, JwtAuthStrategy, PackageRepository],
  controllers: [PackageController],
  exports: [PackageService],
})
export class PackageModule {}
