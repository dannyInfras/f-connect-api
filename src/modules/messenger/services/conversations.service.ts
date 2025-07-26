import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Conversation } from '../entities/conversation.entity';

@Injectable()
export class ConversationsService {
  constructor(
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
  ) {}

  async findOrCreate(user1Id: string, user2Id: string): Promise<Conversation> {
    let conversation = await this.conversationRepository.findOne({
      where: [
        { user1Id, user2Id },
        { user1Id: user2Id, user2Id: user1Id },
      ],
    });

    if (!conversation) {
      conversation = this.conversationRepository.create({ user1Id, user2Id });
      await this.conversationRepository.save(conversation);
    }

    return conversation;
  }

  async findByUser(userId: string): Promise<Conversation[]> {
    return this.conversationRepository.find({
      where: [{ user1Id: userId }, { user2Id: userId }],
      select: {
        id: true,
        user1Id: true,
        user2Id: true,
        createdAt: true,
        updatedAt: true,
        user1: {
          id: true,
          name: true,
          avatar: true,
          company: {
            companyName: true,
            logoUrl: true,
          },
        },
        user2: {
          id: true,
          name: true,
          avatar: true,
          company: {
            companyName: true,
            logoUrl: true,
          },
        },
      },
      relations: ['user1', 'user2', 'user1.company', 'user2.company'],
    });
  }
}
