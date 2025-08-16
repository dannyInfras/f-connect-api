import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Roadmap } from '../roadmap/entities/roadmap.entity';
import { RoadmapRepository } from '../roadmap/repositories/roadmap.repository';
import { RoadmapModule } from '../roadmap/roadmap.module';
import { UserModule } from '../user/user.module';
import { QuizAclService } from './acl/quiz.acl';
import { QuizController } from './controllers/quiz.controller';
import { Quiz } from './entities/quiz.entity';
import { QuizAttempt } from './entities/quiz-attempt.entity';
import { QuizRepository } from './repositories/quiz.repository';
import { QuizAttemptRepository } from './repositories/quiz-attempt.repository';
import { QuizService } from './services/quiz.service';
import { QuizAiService } from './services/quiz-ai.service';
import { QuizAttemptService } from './services/quiz-attempt.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Quiz, QuizAttempt, Roadmap]),
    RoadmapModule,
    ConfigModule,
    UserModule,
  ],
  controllers: [QuizController],
  providers: [
    QuizService,
    QuizAiService,
    QuizAttemptService,
    QuizRepository,
    QuizAttemptRepository,
    RoadmapRepository,
    QuizAclService,
  ],
  exports: [QuizService],
})
export class AiQuizModule {}
