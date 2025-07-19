import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '../user/entities/user.entity';
import { TaskAclService } from './acl/task.acl';
import { TaskController } from './controllers/task.controller';
import { TaskEntity } from './entities/task.entity';
import { TaskNotificationGateway } from './gateways/task-notification.gateway';
import { TaskMapper } from './mapper/task.mapper';
import { TaskRepository } from './repositories/task.repository';
import { TaskService } from './services/task.service';
import { TaskNotificationService } from './services/task-notification.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([TaskEntity, User]),
    ConfigModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [TaskController],
  providers: [
    TaskService,
    TaskRepository,
    TaskAclService,
    TaskMapper,
    TaskNotificationService,
    TaskNotificationGateway,
  ],
  exports: [TaskService],
})
export class RoomModule {} 