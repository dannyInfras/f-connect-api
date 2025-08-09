import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '../user/entities/user.entity';
import { CvAclService } from './acl/cv.acl';
import { CvController } from './controllers/cv.controller';
import { CV } from './entities/cv.entity';
import { CvOptimizationHistory } from './entities/cv-optimization-history.entity';
import { CvRepository } from './repositories/cv.repository';
import { CvOptimizationHistoryRepository } from './repositories/cv-optimization-history.repository';
import { CvService } from './services/cv.service';
import { CvOptimizerService } from './services/cv-optimizer.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([CV, User, CvOptimizationHistory]),
    ConfigModule,
  ],
  controllers: [CvController],
  providers: [
    CvService,
    CvRepository,
    CvAclService,
    CvOptimizerService,
    CvOptimizationHistoryRepository, // Đăng ký repository như provider
  ],
  exports: [CvService],
})
export class CvModule {}
