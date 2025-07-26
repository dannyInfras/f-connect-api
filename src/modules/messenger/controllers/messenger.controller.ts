import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiResponse,ApiTags } from '@nestjs/swagger';

import { UserService } from '@/modules/user/services/user.service';

import { Message } from '../entities/message.entity';
import { ConversationsService } from '../services/conversations.service';
import { MessagesService } from '../services/messenger.service';

@ApiTags('messenger')
@Controller('messenger')
export class MessagesController {
  private readonly logger = new Logger(MessagesController.name);

  constructor(
    private readonly messagesService: MessagesService,
    private readonly conversationsService: ConversationsService,
    private readonly userService: UserService,
  ) {}

  @Get('conversations/:userId')
  @ApiOperation({ summary: 'Get all conversations for a user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Returns all conversations for a user' })
  async getConversations(@Param('userId') userId: string) {
    try {
      this.logger.log(`Getting conversations for user: ${userId}`);
      const conversations = await this.conversationsService.findByUser(userId);
      this.logger.log(`Found ${conversations.length} conversations for user: ${userId}`);
      return conversations;
    } catch (error: any) {
      this.logger.error(`Error getting conversations for user ${userId}: ${error.message}`);
      throw error;
    }
  }

  @Get('messages/:conversationId')
  @ApiOperation({ summary: 'Get all messages for a conversation' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Returns all messages for a conversation' })
  async getMessages(@Param('conversationId') conversationId: string): Promise<Message[]> {
    try {
      this.logger.log(`Getting messages for conversation: ${conversationId}`);
      const messages = await this.messagesService.findByConversation(conversationId);
      this.logger.log(`Found ${messages.length} messages for conversation: ${conversationId}`);
      return messages;
    } catch (error: any) {
      this.logger.error(`Error getting messages for conversation ${conversationId}: ${error.message}`);
      throw error;
    }
  }

  @Post('conversations/start')
  @ApiOperation({ summary: 'Start a new conversation between a user and a company' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Conversation started successfully' })
  async startConversation(@Body() body: { userId: string; companyId: string }) {
    const { userId, companyId } = body;

    // Validate input
    if (!userId || !companyId) {
      this.logger.warn('Missing userId or companyId in startConversation request');
      throw new BadRequestException('userId and companyId are required');
    }

    try {
      this.logger.log(`Starting conversation between user ${userId} and company ${companyId}`);
      
      // Find user associated with company
      const companyUsers = await this.userService.findUserByCompanyId(companyId);
      if (!companyUsers || companyUsers.length === 0) {
        this.logger.warn(`No user found for companyId: ${companyId}`);
        throw new NotFoundException(`No user found for companyId: ${companyId}`);
      }
      const companyUserId = companyUsers[0].id;
      this.logger.log(`Found company user with ID: ${companyUserId}`);

      // Create or find conversation
      const conversation = await this.conversationsService.findOrCreate(
        userId,
        String(companyUserId),
      );
      this.logger.log(`Conversation created/found with ID: ${conversation.id}`);

      return { 
        id: conversation.id,
        user1Id: conversation.user1Id,
        user2Id: conversation.user2Id
      };
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error starting conversation: ${error.message}`);
      throw new BadRequestException(`Error starting conversation: ${error.message}`);
    }
  }

  @Post('messages/:conversationId/mark-read')
  @ApiOperation({ summary: 'Mark messages as read for a user in a conversation' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Messages marked as read' })
  @HttpCode(HttpStatus.OK)
  async markMessagesAsRead(
    @Param('conversationId') conversationId: string,
    @Body() body: { userId: string },
  ) {
    const { userId } = body;
    if (!userId) {
      this.logger.warn('Missing userId in markMessagesAsRead request');
      throw new BadRequestException('userId is required');
    }

    try {
      this.logger.log(`Marking messages as read in conversation ${conversationId} for user ${userId}`);
      await this.messagesService.markAsRead(conversationId, userId);
      this.logger.log(`Successfully marked messages as read in conversation ${conversationId} for user ${userId}`);
      return { success: true };
    } catch (error: any) {
      this.logger.error(`Error marking messages as read: ${error.message}`);
      throw error;
    }
  }
}
