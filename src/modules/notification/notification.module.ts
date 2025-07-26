import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SharedModule } from '@/shared/shared.module';

import { Notification } from './entities/notification.entity';
import { NotificationRepository } from './repositories/notification.repository';
import { NotificationService } from './services/notification.service';
import { NotificationListenerService } from './services/notification-listener.service';
import { ScheduleNotificationListenerService } from './services/schedule-notification-listener.service';

@Module({
  imports: [TypeOrmModule.forFeature([Notification]), SharedModule],
  providers: [
    NotificationRepository,
    NotificationService,
    NotificationListenerService,
    ScheduleNotificationListenerService,
  ],
  exports: [NotificationService],
})
export class NotificationModule {}
