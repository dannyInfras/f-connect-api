import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Notification } from '../entities/notification.entity';

export interface CreateNotificationData {
  userId: number;
  title: string;
  content: string;
}

@Injectable()
export class NotificationRepository {
  constructor(
    @InjectRepository(Notification)
    private readonly repo: Repository<Notification>,
  ) {}

  /**
   * Create a notification for a user
   */
  async createNotification(
    data: CreateNotificationData,
  ): Promise<Notification> {
    const notification = this.repo.create({
      user: { id: data.userId },
      title: data.title,
      content: data.content,
      isRead: false,
    });

    return this.repo.save(notification);
  }

  /**
   * Find notifications for a specific user
   */
  async findByUserId(
    userId: number,
    limit?: number,
    offset?: number,
  ): Promise<{ notifications: Notification[]; count: number }> {
    const [notifications, count] = await this.repo.findAndCount({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return { notifications, count };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(id: number): Promise<void> {
    await this.repo.update(id, { isRead: true });
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: number): Promise<void> {
    await this.repo.update({ user: { id: userId } }, { isRead: true });
  }
}
