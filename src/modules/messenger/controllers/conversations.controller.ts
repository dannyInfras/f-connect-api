import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
} from '@nestjs/common';

import { UserService } from '@/modules/user/services/user.service';

import { Conversation } from '../entities/conversation.entity';
import { ConversationsService } from '../services/conversations.service';

@Controller('conversations')
export class ConversationsController {
  constructor(
    private readonly conversationsService: ConversationsService,
    private readonly userService: UserService,
  ) {}

  @Get(':userId')
  async findByUser(@Param('userId') userId: string): Promise<Conversation[]> {
    return this.conversationsService.findByUser(userId);
  }

  @Post('start')
  async startConversationWithCompany(
    @Body() body: { userId: string; companyId: string },
  ) {
    const { userId, companyId } = body;

    // Validate input
    if (!userId || !companyId) {
      throw new BadRequestException('user1Id and companyId are required');
    }

    try {
      // Find user associated with company
      const companyUsers =
        await this.userService.findUserByCompanyId(companyId);
      if (!companyUsers || companyUsers.length === 0) {
        throw new BadRequestException(
          `No user found for companyId: ${companyId}`,
        );
      }
      const user2Id = companyUsers[0].id;

      // Validate user2Id
      if (!user2Id) {
        throw new BadRequestException('Invalid company user ID');
      }
      // Find or create conversation
      const conversation = await this.conversationsService.findOrCreate(
        userId,
        String(user2Id),
      );

      return { conversationId: conversation.id };
    } catch (error) {
      console.error('Error in startConversationWithCompany:', error);
    }
  }
}
