import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { JwtAuthStrategy } from '@/modules/auth/strategies/jwt-auth.strategy';
import { CompanyRepository } from '@/modules/company/repositories/company.repository';
import { NotificationModule } from '@/modules/notification/notification.module';
import { UserRepository } from '@/modules/user/repositories/user.repository';
import { SharedModule } from '@/shared/shared.module';

import { ScheduleController } from './controllers/schedule.controller';
import { ScheduleEvent } from './entities/schedule-event.entity';
import { ScheduleParticipant } from './entities/schedule-participant.entity';
import { ScheduleEventRepository } from './repositories/schedule-event.repository';
import { ScheduleParticipantRepository } from './repositories/schedule-participant.repository';
import { ScheduleService } from './services/schedule.service';
import { ScheduleAclService } from './services/schedule-acl.service';
import { ScheduleNotificationService } from './services/schedule-notification.service';
import { ScheduleReminderService } from './services/schedule-reminder.service';

@Module({
  imports: [
    SharedModule,
    NotificationModule,
    TypeOrmModule.forFeature([ScheduleEvent, ScheduleParticipant]),
  ],
  providers: [
    ScheduleService,
    ScheduleAclService,
    ScheduleNotificationService,
    ScheduleReminderService,
    ScheduleEventRepository,
    ScheduleParticipantRepository,
    JwtAuthStrategy,
    UserRepository,
    CompanyRepository,
  ],
  controllers: [ScheduleController],
  exports: [ScheduleService],
})
export class ScheduleModule {}
