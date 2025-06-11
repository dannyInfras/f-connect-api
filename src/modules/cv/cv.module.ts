import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '../user/entities/user.entity';
import { CvAclService } from './acl/cv.acl';
import { CvController } from './controllers/cv.controller';
import { CV } from './entities/cv.entity';
import { CvRepository } from './repositories/cv.repository';
import { CvService } from './services/cv.service';
import { CvOptimizerService } from './services/cv-optimizer.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([CV, User]),
    ConfigModule,
  ],
  controllers: [CvController],
  providers: [
    CvService,
    CvRepository,
    CvAclService,
    CvOptimizerService,
  ],
  exports: [CvService],
})
export class CvModule {} 
