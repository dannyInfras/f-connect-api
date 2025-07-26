import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Message } from '../entities/message.entity';

@Injectable()
export class MessagesService {
  private readonly logger = new Logger(MessagesService.name);

  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
  ) {}

  async findByConversation(conversationId: string): Promise<Message[]> {
    try {
      this.logger.log(`Finding messages for conversation: ${conversationId}`);
      const messages = await this.messageRepository.find({
        where: { conversationId },
        order: { createdAt: 'ASC' },
        relations: ['sender', 'sender.company'],
      });
      this.logger.log(
        `Found ${messages.length} messages for conversation: ${conversationId}`,
      );
      return messages;
    } catch (error: any) {
      this.logger.error(
        `Error finding messages for conversation ${conversationId}: ${error.message}`,
      );
      throw error;
    }
  }

  async createMessage(
    conversationId: string,
    senderId: string,
    content: string,
    type: 'text' | 'file' | 'image' = 'text',
  ): Promise<Message> {
    try {
      this.logger.log(
        `Creating message in conversation ${conversationId} from sender ${senderId}`,
      );

      const message = this.messageRepository.create({
        conversationId,
        senderId,
        content,
        type,
        isRead: false,
      });

      const savedMessage = await this.messageRepository.save(message);
      this.logger.log(`Message created with ID: ${savedMessage.id}`);
      return savedMessage;
    } catch (error: any) {
      this.logger.error(`Error creating message: ${error.message}`);
      throw error;
    }
  }

  async markAsRead(conversationId: string, userId: string): Promise<void> {
    try {
      this.logger.log(
        `Marking messages as read in conversation ${conversationId} for user ${userId}`,
      );

      // Mark messages as read where the current user is NOT the sender
      // (i.e., mark messages FROM other users TO the current user as read)
      const result = await this.messageRepository
        .createQueryBuilder()
        .update(Message)
        .set({ isRead: true })
        .where('conversationId = :conversationId', { conversationId })
        .andWhere('senderId != :userId', { userId }) // Messages not sent by current user
        .andWhere('isRead = :isRead', { isRead: false }) // Only unread messages
        .execute();

      this.logger.log(
        `Marked ${result.affected || 0} messages as read in conversation ${conversationId}`,
      );
    } catch (error: any) {
      this.logger.error(`Error marking messages as read: ${error.message}`);
      throw error;
    }
  }
}
