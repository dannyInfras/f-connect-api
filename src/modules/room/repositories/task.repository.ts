import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, LessThanOrEqual, Repository } from 'typeorm';

import { TaskEntity } from '../entities/task.entity';

@Injectable()
export class TaskRepository {
  constructor(
    @InjectRepository(TaskEntity)
    private readonly repository: Repository<TaskEntity>,
  ) {}

  async findAll(): Promise<TaskEntity[]> {
    return this.repository.find({
      relations: ['user'],
    });
  }

  async findById(id: string): Promise<TaskEntity | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['user'],
    });
  }

  async findByUserId(userId: number): Promise<TaskEntity[]> {
    return this.repository.find({
      where: { userId },
      relations: ['user'],
    });
  }

  async create(data: Partial<TaskEntity>): Promise<TaskEntity> {
    const task = this.repository.create(data);
    return this.repository.save(task);
  }

  async update(id: string, data: Partial<TaskEntity>): Promise<TaskEntity | null> {
    await this.repository.update(id, data);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async findTasksWithUpcomingReminders(from: Date, to: Date): Promise<TaskEntity[]> {
    return this.repository.find({
      where: {
        reminderTime: Between(from, to),
        status: LessThanOrEqual('REVIEW'), // Only for tasks not done
      },
      relations: ['user'],
    });
  }

  async findTasksWithUpcomingDueDates(from: Date, to: Date): Promise<TaskEntity[]> {
    return this.repository.find({
      where: {
        dueDate: Between(from, to),
        status: LessThanOrEqual('REVIEW'), // Only for tasks not done
      },
      relations: ['user'],
    });
  }
} 