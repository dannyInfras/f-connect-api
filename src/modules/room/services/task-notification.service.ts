import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { TaskNotificationGateway } from '../gateways/task-notification.gateway';
import { TaskMapper } from '../mapper/task.mapper';
import { TaskRepository } from '../repositories/task.repository';

@Injectable()
export class TaskNotificationService {
  private readonly logger = new Logger(TaskNotificationService.name);

  constructor(
    private readonly taskRepository: TaskRepository,
    private readonly taskMapper: TaskMapper,
    private readonly notificationGateway: TaskNotificationGateway,
  ) {}

  // Run every minute to check for reminders
  @Cron(CronExpression.EVERY_MINUTE)
  async handleReminders() {
    this.logger.debug('Checking for task reminders...');
    
    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
    
    try {
      const tasksWithReminders = await this.taskRepository.findTasksWithUpcomingReminders(
        now,
        fiveMinutesFromNow
      );
      
      for (const task of tasksWithReminders) {
        const taskDto = this.taskMapper.toDto(task);
        if (taskDto) {
          this.logger.log(`Sending reminder notification for task: ${task.title}`);
          this.notificationGateway.sendTaskReminder(task.userId, taskDto);
        }
      }
    } catch (error) {
      this.logger.error('Error processing reminders', error);
    }
  }
  
  // Run every hour to check for upcoming due dates
  @Cron(CronExpression.EVERY_HOUR)
  async handleDueDates() {
    this.logger.debug('Checking for upcoming task due dates...');
    
    const now = new Date();
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    try {
      const tasksWithDueDates = await this.taskRepository.findTasksWithUpcomingDueDates(
        now,
        oneDayFromNow
      );
      
      for (const task of tasksWithDueDates) {
        const taskDto = this.taskMapper.toDto(task);
        if (taskDto) {
          this.logger.log(`Sending due date notification for task: ${task.title}`);
          this.notificationGateway.sendTaskDueDate(task.userId, taskDto);
        }
      }
    } catch (error) {
      this.logger.error('Error processing due dates', error);
    }
  }
} 