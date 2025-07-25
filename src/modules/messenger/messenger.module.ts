import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Company } from '@/modules/company/entities/company.entity';

import { UserModule } from '../user/user.module';
import { MessagesController } from './controllers/messenger.controller';
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';
import { MessengerGateway } from './gateways/messenger.gateway';
import { ConversationsService } from './services/conversations.service';
import { MessagesService } from './services/messenger.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Conversation, Message, Company]),
    UserModule,
  ],
  controllers: [MessagesController],
  providers: [MessagesService, MessengerGateway, ConversationsService],
  exports: [MessagesService, ConversationsService],
})
export class MessengerModule {}
