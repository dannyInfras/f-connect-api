import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '../user/entities/user.entity';
import { TaskAclService } from './acl/task.acl';
import { TaskController } from './controllers/task.controller';
import { TaskEntity } from './entities/task.entity';
import { TaskMapper } from './mapper/task.mapper';
import { TaskRepository } from './repositories/task.repository';
import { TaskService } from './services/task.service';

@Module({
  imports: [TypeOrmModule.forFeature([TaskEntity, User]), ConfigModule],
  controllers: [TaskController],
  providers: [TaskService, TaskRepository, TaskAclService, TaskMapper],
  exports: [TaskService],
})
export class RoomModule {}
