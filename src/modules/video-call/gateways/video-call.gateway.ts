import { Logger } from '@nestjs/common';
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
import { v4 as uuidv4 } from 'uuid';

import {
  AcceptCallEventData,
  CallUserEventData,
  CancelCallEventData,
  ChatMessageEventData,
  MediaToggleEventData,
  MeetRenameEventData,
  RejectCallEventData,
  ScreenSharingEventData,
} from '../interfaces/call-events.interface';
import { User } from '../interfaces/user.interface';
import { VideoCallService } from '../services/video-call.service';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  namespace: 'video-call',
})
export class VideoCallGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(VideoCallGateway.name);

  constructor(private readonly videoCallService: VideoCallService) {}

  async handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    // Get the user associated with this socket
    const userId = client.data.userId;
    if (!userId) return;

    // Check if user is in a meeting
    const meeting = this.videoCallService.getUserMeeting(userId);
    if (meeting) {
      // Notify other participants that this user has left
      const updatedMeeting = this.videoCallService.removeParticipantFromMeeting(
        meeting.id,
        userId,
      );

      if (updatedMeeting) {
        // Broadcast to other participants that this user has left
        client.to(meeting.id).emit('user-left', { userId, meetId: meeting.id });
      } else {
        // Meeting was deleted because no participants left
        this.logger.log(
          `Meeting ${meeting.id} was removed as no participants left`,
        );
      }
    }

    // Remove user from our registry
    this.videoCallService.removeUser(userId);
  }

  @SubscribeMessage('save-user-data')
  handleSaveUserData(
    @ConnectedSocket() client: Socket,
    @MessageBody() userData: User,
  ) {
    try {
      // Store the user data
      this.videoCallService.saveUser(userData);

      // Associate this socket with the user ID
      client.data.userId = userData.id;

      return { success: true };
    } catch (error) {
      this.logger.error(`Error saving user data: ${error}`);
      return { success: false, error: error };
    }
  }

  @SubscribeMessage('check-meet-link')
  handleCheckMeetLink(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { meetId: string },
  ) {
    try {
      const meeting = this.videoCallService.getMeeting(data.meetId);
      return { exists: !!meeting };
    } catch (error) {
      this.logger.error(`Error checking meet link: ${error}`);
      return { exists: false, error: error };
    }
  }

  @SubscribeMessage('call-user')
  handleCallUser(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: CallUserEventData,
  ) {
    try {
      const { to, from, signal } = data;

      // Check if the recipient exists
      const recipient = this.videoCallService.getUser(to);
      if (!recipient) {
        return { success: false, error: 'Recipient not found' };
      }

      // Check if caller is already in a meeting
      if (this.videoCallService.isUserInMeeting(from.id)) {
        return { success: false, error: 'You are already in a meeting' };
      }

      // Check if recipient is already in a meeting
      if (this.videoCallService.isUserInMeeting(to)) {
        return { success: false, error: 'Recipient is already in a meeting' };
      }

      // Forward the call request to the recipient
      client.to(to).emit('incoming-call', { from, signal });

      return { success: true };
    } catch (error) {
      this.logger.error(`Error calling user: ${error}`);
      return { success: false, error: error };
    }
  }

  @SubscribeMessage('accept-call')
  handleAcceptCall(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: AcceptCallEventData,
  ) {
    try {
      const { to, from, signal, meetName } = data;

      // Create a new meeting
      const meetId = uuidv4();
      this.videoCallService.createMeeting(
        meetId,
        meetName || 'New Meeting',
        from.id,
      );

      // Add the caller to the meeting
      this.videoCallService.addParticipantToMeeting(meetId, to);

      // Join the socket room for this meeting
      client.join(meetId);

      // Send the acceptance to the caller
      client.to(to).emit('call-accepted', { from, signal, meetId });

      return { success: true, meetId };
    } catch (error) {
      this.logger.error(`Error accepting call: ${error}`);
      return { success: false, error: error };
    }
  }

  @SubscribeMessage('join-meeting')
  handleJoinMeeting(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string; meetId: string },
  ) {
    try {
      const { userId, meetId } = data;

      // Check if meeting exists
      const meeting = this.videoCallService.getMeeting(meetId);
      if (!meeting) {
        return { success: false, error: 'Meeting not found' };
      }

      // Add user to meeting
      this.videoCallService.addParticipantToMeeting(meetId, userId);

      // Join the socket room
      client.join(meetId);

      // Get all participants
      const participants = Array.from(meeting.participants.values());

      // Notify others that this user has joined
      client.to(meetId).emit('user-joined', {
        user: this.videoCallService.getUser(userId),
        meetId,
      });

      return {
        success: true,
        meeting: {
          ...meeting,
          participants: participants,
        },
      };
    } catch (error) {
      this.logger.error(`Error joining meeting: ${error}`);
      return { success: false, error: error };
    }
  }

  @SubscribeMessage('reject-call')
  handleRejectCall(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: RejectCallEventData,
  ) {
    try {
      const { to, from } = data;
      client.to(to).emit('call-rejected', { from });
      return { success: true };
    } catch (error) {
      this.logger.error(`Error rejecting call: ${error}`);
      return { success: false, error: error };
    }
  }

  @SubscribeMessage('cancel-meet-request')
  handleCancelMeetRequest(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: CancelCallEventData,
  ) {
    try {
      const { to, from } = data;
      client.to(to).emit('call-canceled', { from });
      return { success: true };
    } catch (error) {
      this.logger.error(`Error canceling call: ${error}`);
      return { success: false, error: error };
    }
  }

  @SubscribeMessage('already-in-meet')
  handleAlreadyInMeet(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { to: string; from: User },
  ) {
    try {
      const { to, from } = data;
      client.to(to).emit('user-busy', { from });
      return { success: true };
    } catch (error) {
      this.logger.error(`Error in already-in-meet: ${error}`);
      return { success: false, error: error };
    }
  }

  @SubscribeMessage('update-user-audio')
  handleUpdateUserAudio(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: MediaToggleEventData,
  ) {
    try {
      const { userId, meetId, status } = data;
      client.to(meetId).emit('user-audio-changed', { userId, status });
      return { success: true };
    } catch (error) {
      this.logger.error(`Error updating user audio: ${error}`);
      return { success: false, error: error };
    }
  }

  @SubscribeMessage('update-user-video')
  handleUpdateUserVideo(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: MediaToggleEventData,
  ) {
    try {
      const { userId, meetId, status } = data;
      client.to(meetId).emit('user-video-changed', { userId, status });
      return { success: true };
    } catch (error) {
      this.logger.error(`Error updating user video: ${error}`);
      return { success: false, error: error };
    }
  }

  @SubscribeMessage('update-screen-sharing')
  handleUpdateScreenSharing(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: ScreenSharingEventData,
  ) {
    try {
      const { userId, meetId, status } = data;
      client.to(meetId).emit('screen-sharing-changed', { userId, status });
      return { success: true };
    } catch (error) {
      this.logger.error(`Error updating screen sharing: ${error}`);
      return { success: false, error: error };
    }
  }

  @SubscribeMessage('rename-meeting')
  handleMeetNewName(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: MeetRenameEventData,
  ) {
    try {
      const { meetId, name } = data;

      // Update meeting name
      const updatedMeeting = this.videoCallService.renameMeeting(meetId, name);
      
      if (updatedMeeting) {
        // Notify all participants of the name change
        this.server.to(meetId).emit('meeting-renamed', { 
          meetId, 
          name 
        });
        
        return { success: true };
      }
      
      return { success: false, error: 'Meeting not found' };
    } catch (error) {
      this.logger.error(`Error renaming meeting: ${error}`);
      return { success: false, error: error };
    }
  }

  @SubscribeMessage('send-message')
  handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: ChatMessageEventData,
  ) {
    try {
      const { meetId, message, from, timestamp } = data;
      
      // Broadcast the message to all meeting participants
      this.server.to(meetId).emit('chat-message', {
        meetId,
        message,
        from,
        timestamp: timestamp || new Date(),
      });
      
      return { success: true };
    } catch (error) {
      this.logger.error(`Error sending message: ${error}`);
      return { success: false, error: error };
    }
  }

  @SubscribeMessage('remove-from-meeting')
  handleRemoveFromMeet(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string; meetId: string },
  ) {
    try {
      const { userId, meetId } = data;
      
      // Get the meeting
      const meeting = this.videoCallService.getMeeting(meetId);
      if (!meeting) {
        return { success: false, error: 'Meeting not found' };
      }
      
      // Remove the participant
      const updatedMeeting = this.videoCallService.removeParticipantFromMeeting(
        meetId,
        userId
      );
      
      if (updatedMeeting) {
        // Notify others that this user has been removed
        this.server.to(meetId).emit('user-removed', { userId, meetId });
        
        // Notify the removed user
        this.server.to(userId).emit('you-were-removed', { meetId });
        
        return { success: true };
      }
      
      return { success: false, error: 'Failed to remove user' };
    } catch (error) {
      this.logger.error(`Error removing user from meeting: ${error}`);
      return { success: false, error: error };
    }
  }

  @SubscribeMessage('leave-meeting')
  handleLeftMeet(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string; meetId: string },
  ) {
    try {
      const { userId, meetId } = data;
      
      // Remove the participant from the meeting
      const updatedMeeting = this.videoCallService.removeParticipantFromMeeting(
        meetId,
        userId
      );
      
      // Leave the socket room
      client.leave(meetId);
      
      if (updatedMeeting) {
        // Notify others that this user has left
        client.to(meetId).emit('user-left', { userId, meetId });
      }
      
      return { success: true };
    } catch (error) {
      this.logger.error(`Error leaving meeting: ${error}`);
      return { success: false, error: error };
    }
  }
}
