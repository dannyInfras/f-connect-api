import { Injectable, Logger } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

import { TaskResDto } from '../dtos/res/task.res';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'tasks',
})
@Injectable()
export class TaskNotificationGateway {
  private readonly logger = new Logger(TaskNotificationGateway.name);

  @WebSocketServer()
  server: Server;

  // Store connected users and their socket IDs
  private connectedUsers: Map<number, string[]> = new Map();

  handleConnection(client: any) {
    const userId = client.handshake.query.userId;
    if (userId) {
      const userIdNum = Number(userId);
      const existingConnections = this.connectedUsers.get(userIdNum) || [];
      existingConnections.push(client.id);
      this.connectedUsers.set(userIdNum, existingConnections);
      this.logger.log(`Client connected: ${client.id} for user ${userId}`);
    }
  }

  handleDisconnect(client: any) {
    // Remove the disconnected client from connectedUsers
    for (const [userId, socketIds] of this.connectedUsers.entries()) {
      const updatedSocketIds = socketIds.filter((id) => id !== client.id);
      if (updatedSocketIds.length === 0) {
        this.connectedUsers.delete(userId);
      } else {
        this.connectedUsers.set(userId, updatedSocketIds);
      }
    }
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  sendTaskReminder(userId: number, task: TaskResDto) {
    const socketIds = this.connectedUsers.get(userId);
    if (socketIds && socketIds.length > 0) {
      for (const socketId of socketIds) {
        this.server.to(socketId).emit('taskReminder', {
          message: `Reminder: Task "${task.title}" is due soon`,
          task,
        });
      }
      this.logger.log(`Sent reminder for task ${task.id} to user ${userId}`);
    }
  }

  sendTaskDueDate(userId: number, task: TaskResDto) {
    const socketIds = this.connectedUsers.get(userId);
    if (socketIds && socketIds.length > 0) {
      for (const socketId of socketIds) {
        this.server.to(socketId).emit('taskDueDate', {
          message: `Task "${task.title}" is due in less than 24 hours`,
          task,
        });
      }
      this.logger.log(
        `Sent due date notification for task ${task.id} to user ${userId}`,
      );
    }
  }

  notifyTaskCreated(userId: number, task: TaskResDto) {
    const socketIds = this.connectedUsers.get(userId);
    if (socketIds && socketIds.length > 0) {
      for (const socketId of socketIds) {
        this.server.to(socketId).emit('taskCreated', { task });
      }
    }
  }

  notifyTaskUpdated(userId: number, task: TaskResDto) {
    const socketIds = this.connectedUsers.get(userId);
    if (socketIds && socketIds.length > 0) {
      for (const socketId of socketIds) {
        this.server.to(socketId).emit('taskUpdated', { task });
      }
    }
  }

  notifyTaskDeleted(userId: number, taskId: string) {
    const socketIds = this.connectedUsers.get(userId);
    if (socketIds && socketIds.length > 0) {
      for (const socketId of socketIds) {
        this.server.to(socketId).emit('taskDeleted', { taskId });
      }
    }
  }
}
