import { Injectable } from '@nestjs/common';

import { AppLogger } from '@/shared/logger/logger.service';

import { Notification } from '../entities/notification.entity';
import {
  CreateNotificationData,
  NotificationRepository,
} from '../repositories/notification.repository';

@Injectable()
export class NotificationService {
  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(NotificationService.name);
  }

  /**
   * Create a notification for a user
   */
  async createNotification(
    data: CreateNotificationData,
  ): Promise<Notification> {
    try {
      const notification =
        await this.notificationRepository.createNotification(data);

      this.logger.log(
        { requestID: 'internal', url: 'internal', ip: '0.0.0.0', user: null },
        `Created notification for user ${data.userId}: ${data.title}`,
      );

      return notification;
    } catch (error) {
      this.logger.error(
        { requestID: 'internal', url: 'internal', ip: '0.0.0.0', user: null },
        `Failed to create notification for user ${data.userId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  /**
   * Get notifications for a user
   */
  async getUserNotifications(
    userId: number,
    limit?: number,
    offset?: number,
  ): Promise<{ notifications: Notification[]; count: number }> {
    return this.notificationRepository.findByUserId(userId, limit, offset);
  }

  /**
   * Mark notification as read
   */
  async markAsRead(id: number): Promise<void> {
    await this.notificationRepository.markAsRead(id);
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: number): Promise<void> {
    await this.notificationRepository.markAllAsRead(userId);
  }
}
