import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Repository } from 'typeorm';

import { ROLE } from '@/modules/auth/constants/role.constant';
import { UserAccessTokenClaims } from '@/modules/auth/dtos/auth-token-output.dto';
import { UserService } from '@/modules/user/services/user.service';
import { RequestContext } from '@/shared/request-context/request-context.dto';

import { Conversation } from '../entities/conversation.entity';
import { Message } from '../entities/message.entity';
import { MessagesService } from '../services/messenger.service';

interface MessagePayload {
  conversationId: string;
  content: string;
  senderId: string;
}

interface VideoCallPayload {
  conversationId: string;
  to: string;
  from: string;
  signal?: any;
  enabled?: boolean;
  reason?: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  },
  namespace: 'messenger'
})
@Injectable()
export class MessengerGateway
  implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MessengerGateway.name);
  private connectedUsers: Map<string, Socket> = new Map();
  private userConversations: Map<string, string[]> = new Map();

  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
    private userService: UserService,
    private messagesService: MessagesService,
  ) { }

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      this.logger.log(`User ${userId} connected`);
      this.connectedUsers.set(userId, client);

      // Notify all users that this user is online
      this.server.emit('userStatus', { userId, isOnline: true });

      // Join user to all their conversations
      this.findUserConversations(userId).then(conversationIds => {
        if (!conversationIds.length) return;

        this.userConversations.set(userId, conversationIds);
        conversationIds.forEach(convId => {
          client.join(convId);
        });
      });
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      this.logger.log(`User ${userId} disconnected`);
      this.connectedUsers.delete(userId);
      this.userConversations.delete(userId);

      // Notify all users that this user is offline
      this.server.emit('userStatus', { userId, isOnline: false });
    }
  }

  @SubscribeMessage('joinConversation')
  handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() conversationId: string,
  ) {
    client.join(conversationId);
    return { success: true };
  }

  @SubscribeMessage('leaveConversation')
  handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() conversationId: string,
  ) {
    client.leave(conversationId);
    return { success: true };
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: MessagePayload,
  ) {
    try {
      const { conversationId, content, senderId } = payload;

      this.logger.log(`Received message from user ${senderId} in conversation ${conversationId}`);

      // Validate conversation exists
      const conversation = await this.conversationRepository.findOne({
        where: { id: conversationId },
        relations: ['user1', 'user2'],
      });

      if (!conversation) {
        this.logger.error(`Conversation ${conversationId} not found`);
        return { success: false, error: 'Conversation not found' };
      }

      // Create and save message
      let message;
      try {
        message = await this.messagesService.createMessage(
          conversationId,
          senderId,
          content,
        );
        this.logger.log(`Message created with ID: ${message.id}`);
      } catch (error: any) {
        this.logger.error(`Error creating message: ${error.message}`);
        throw error;
      }

      // Create a minimal RequestContext with required user info
      const ctx = new RequestContext();
      const userClaims = new UserAccessTokenClaims();
      userClaims.id = parseInt(senderId);
      userClaims.email = ''; // We don't need this for the query
      userClaims.roles = [ROLE.USER]; // Default role
      ctx.user = userClaims;

      // Get sender info for the response with company relation
      let sender;
      try {
        sender = await this.userService.findById(ctx, parseInt(senderId));
        this.logger.log(`Found sender: ${sender.name}`);
      } catch (error: any) {
        this.logger.error(`Error finding sender: ${error.message}`);
        throw error;
      }

      const fullMessage = {
        ...message,
        sender,
      };

      // Emit to all clients in the conversation room
      this.logger.log(`Emitting message to conversation room: ${conversationId}`);
      this.server.to(conversationId).emit('newMessage', fullMessage);

      // Determine recipient
      const recipientId = conversation.user1Id === senderId
        ? conversation.user2Id
        : conversation.user1Id;

      // Check if recipient is online but not in this conversation
      const recipientSocket = this.connectedUsers.get(recipientId);
      if (recipientSocket) {
        // Send notification to recipient if they're not in this conversation
        const recipientConversations = this.userConversations.get(recipientId) || [];
        if (!recipientConversations.includes(conversationId)) {
          this.logger.log(`Sending notification to recipient: ${recipientId}`);
          recipientSocket.emit('messageNotification', {
            conversationId,
            message: fullMessage,
          });
        }
      }

      // Update conversation timestamp
      try {
        await this.conversationRepository.update(
          { id: conversationId },
          { updatedAt: new Date() }
        );
        this.logger.log(`Updated conversation timestamp for: ${conversationId}`);
      } catch (error: any) {
        this.logger.error(`Error updating conversation timestamp: ${error.message}`);
      }

      return { success: true, message: fullMessage };
    } catch (error: any) {
      this.logger.error(`Error handling message: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  private async findUserConversations(userId: string): Promise<string[]> {
    try {
      const conversations = await this.conversationRepository.find({
        where: [
          { user1Id: userId },
          { user2Id: userId },
        ],
      });
      return conversations.map(c => c.id);
    } catch (error: any) {
      this.logger.error(`Error finding user conversations: ${error.message}`);
      return [];
    }
  }

  // Video Call Event Handlers
  @SubscribeMessage('video-call-offer')
  handleVideoCallOffer(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: VideoCallPayload,
  ) {
    this.logger.log(`Video call offer from ${payload.from} to ${payload.to} in conversation ${payload.conversationId}`);

    const recipientSocket = this.connectedUsers.get(payload.to);
    if (recipientSocket) {
      recipientSocket.emit('video-call-offer', {
        from: payload.from,
        signal: payload.signal,
        conversationId: payload.conversationId,
      });
      this.logger.log(`Video call offer sent to recipient: ${payload.to}`);
    } else {
      this.logger.log(`Recipient ${payload.to} is not online`);
      client.emit('video-call-user-offline', { userId: payload.to });
    }

    return { success: true };
  }

  @SubscribeMessage('video-call-decline')
  async handleVideoCallDecline(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: VideoCallPayload,
  ) {
    this.logger.log(`Video call declined by ${payload.from} for ${payload.to}`);

    const recipientSocket = this.connectedUsers.get(payload.to);
    if (recipientSocket) {
      recipientSocket.emit('video-call-declined', {
        from: payload.from,
        conversationId: payload.conversationId,
      });
    }

    // Create system message for declined call
    try {
      const systemMessage = await this.messagesService.createMessage(
        payload.conversationId,
        payload.from,
        '📞 Video call declined',
        'text'
      );

      this.server.to(payload.conversationId).emit('newMessage', {
        ...systemMessage,
        sender: { id: payload.from, name: 'System' }
      });

    } catch (error: any) {
      this.logger.error(`Error creating declined call message: ${error.message}`);
    }

    return { success: true };
  }

  @SubscribeMessage('video-call-started')
  async handleVideoCallStarted(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: VideoCallPayload,
  ) {
    this.logger.log(`Video call started between ${payload.from} and ${payload.to}`);
    
    // Create system message for call started
    try {
      const systemMessage = await this.messagesService.createMessage(
        payload.conversationId,
        payload.from,
        '📞 Video call started',
        'text'
      );

      this.server.to(payload.conversationId).emit('newMessage', {
        ...systemMessage,
        sender: { id: payload.from, name: 'System' }
      });

    } catch (error: any) {
      this.logger.error(`Error creating call started message: ${error.message}`);
    }

    return { success: true };
  }

  @SubscribeMessage('video-call-answer')
  handleVideoCallAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: VideoCallPayload,
  ) {
    this.logger.log(`Video call answer from ${payload.from} to ${payload.to}`);

    const recipientSocket = this.connectedUsers.get(payload.to);
    if (recipientSocket) {
      recipientSocket.emit('video-call-answer', {
        from: payload.from,
        signal: payload.signal,
        conversationId: payload.conversationId,
      });
    }

    return { success: true };
  }

  @SubscribeMessage('video-call-end')
  async handleVideoCallEnd(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: VideoCallPayload,
  ) {
    this.logger.log(`Video call ended by ${payload.from} for ${payload.to}, reason: ${payload.reason || 'normal'}`);

    const recipientSocket = this.connectedUsers.get(payload.to);
    if (recipientSocket) {
      recipientSocket.emit('video-call-end', {
        from: payload.from,
        conversationId: payload.conversationId,
        reason: payload.reason,
      });
    }

    // Create system message for missed call or call ended
    try {
      let messageContent = '';
      if (payload.reason === 'timeout') {
        messageContent = '📞 Missed video call';
      } else if (payload.reason === 'busy') {
        messageContent = '📞 Video call - User busy';
      } else {
        messageContent = '📞 Video call ended';
      }

      const systemMessage = await this.messagesService.createMessage(
        payload.conversationId,
        payload.from,
        messageContent,
        'text'
      );

      // Emit the system message to both users
      this.server.to(payload.conversationId).emit('newMessage', {
        ...systemMessage,
        sender: { id: payload.from, name: 'System' }
      });

    } catch (error: any) {
      this.logger.error(`Error creating call end message: ${error.message}`);
    }

    return { success: true };
  }

  @SubscribeMessage('video-call-toggle-video')
  handleVideoCallToggleVideo(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: VideoCallPayload,
  ) {
    const recipientSocket = this.connectedUsers.get(payload.to);
    if (recipientSocket) {
      recipientSocket.emit('video-call-toggle-video', {
        from: payload.from,
        enabled: payload.enabled,
        conversationId: payload.conversationId,
      });
    }

    return { success: true };
  }

  @SubscribeMessage('video-call-toggle-audio')
  handleVideoCallToggleAudio(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: VideoCallPayload,
  ) {
    const recipientSocket = this.connectedUsers.get(payload.to);
    if (recipientSocket) {
      recipientSocket.emit('video-call-toggle-audio', {
        from: payload.from,
        enabled: payload.enabled,
        conversationId: payload.conversationId,
      });
    }

    return { success: true };
  }
}
