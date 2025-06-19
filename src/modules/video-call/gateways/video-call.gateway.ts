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

import { JoinRequest } from '../interfaces/meeting.interface';
import { User } from '../interfaces/user.interface';
import { VideoCallService } from '../services/video-call.service';

interface SignalEventData {
  to: string;
  from: string;
  signal: any;
  meetId: string;
}

interface CreateMeetEventData {
  meetId: string;
  meetName: string;
}

interface JoinMeetEventData {
  meetId: string;
  user: User;
}

interface MeetRenameEventData {
  meetId: string;
  newMeetName: string;
}

interface MediaToggleEventData {
  userId: string;
  meetId: string;
  status: boolean;
}

interface ScreenSharingEventData {
  userId: string;
  meetId: string;
  status: boolean;
}

interface ChatMessageEventData {
  meetId: string;
  message: string;
  from: User;
  timestamp: string;
}

interface RemoveFromMeetEventData {
  userId: string;
  meetId: string;
}

interface LeftMeetEventData {
  userId: string;
  meetId: string;
}

interface RejectCallEventData {
  to: string;
  from: User;
}

interface CancelMeetRequestEventData {
  meetId: string;
}

interface RequestJoinMeetEventData {
  meetId: string;
  user: User;
}

interface ApproveJoinRequestEventData {
  requestId: string;
  meetId: string;
  userId: string;
}

interface RejectJoinRequestEventData {
  requestId: string;
  meetId: string;
  userId: string;
}

interface CancelJoinRequestEventData {
  requestId: string;
  meetId: string;
}

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
    try {
      const userId = client.data.userId;
      if (!userId) return;

      // Leave user-specific room
      client.leave(`user:${userId}`);

      // Handle active meeting
      const meeting = this.videoCallService.getUserMeeting(userId);
      if (meeting) {
        // Remove from meeting and notify others
        const updatedMeeting =
          this.videoCallService.removeParticipantFromMeeting(
            meeting.id,
            userId,
          );

        if (updatedMeeting) {
          await this.server.to(meeting.id).emit('other-user-left-meet', {
            userId,
            isHost: meeting.createdBy === userId,
          });
          client.leave(meeting.id);
        } else {
          this.logger.log(
            `Meeting ${meeting.id} removed - no participants left`,
          );
        }
      }

      // Clean up user data
      this.videoCallService.removeUser(userId);
      this.logger.log(`Client disconnected: ${client.id} (User: ${userId})`);
    } catch (error) {
      this.logger.error(`Error handling disconnect: ${error}`);
    }
  }

  @SubscribeMessage('new-message')
  handleNewMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: ChatMessageEventData,
  ) {
    try {
      const { meetId, message, from, timestamp } = data;

      // Add validation
      if (!meetId || !message || !from || !timestamp) {
        throw new Error('Invalid message data');
      }

      // Verify meeting exists and user is a participant
      const meeting = this.videoCallService.getMeeting(meetId);
      if (!meeting) {
        throw new Error('Meeting not found');
      }

      if (!meeting.participants.has(from.id)) {
        throw new Error('User not in meeting');
      }

      // Log the message event
      this.logger.debug(
        `Message from ${from.id} in meeting ${meetId}: ${message.substring(0, 50)}...`,
      );

      // Broadcast message to all participants in the room
      this.server.to(meetId).emit('new-message', {
        meetId,
        message,
        from,
        timestamp: timestamp || new Date().toISOString(),
      });

      return { success: true };
    } catch (error) {
      this.logger.error(`Error sending message: ${error}`);
      return { success: false, error: error?.toString() };
    }
  }

  @SubscribeMessage('save-user-data')
  handleSaveUserData(
    @ConnectedSocket() client: Socket,
    @MessageBody() userData: User,
  ) {
    try {
      if (!userData.id || !userData.name || !userData.email) {
        throw new Error('Invalid user data');
      }
      this.videoCallService.saveUser(userData);
      client.data.userId = userData.id;

      // Associate the socket with the user ID for easier targeting
      client.join(`user:${userData.id}`);

      this.logger.log(`User data saved for ${userData.id}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Error saving user data: ${error}`);
      return { success: false, error: error };
    }
  }

  @SubscribeMessage('create-meet')
  handleCreateMeet(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: CreateMeetEventData,
  ) {
    try {
      const { meetId, meetName } = data;
      const creatorId = client.data.userId;

      console.log('Creator ID:', creatorId);
      if (!creatorId) {
        throw new Error('User not authenticated');
      }

      if (!meetId || !meetName) {
        throw new Error('Invalid meeting data');
      }

      if (this.videoCallService.isUserInMeeting(creatorId)) {
        throw new Error('User already in a meeting');
      }

      this.videoCallService.createMeeting(meetId, meetName, creatorId);
      client.join(meetId);
      this.logger.log(
        `Meeting created: ${meetId} (${meetName}) by user ${creatorId}`,
      );

      return { success: true, meetId, meetName, clientData: client.data };
    } catch (error) {
      this.logger.error(`Error creating meeting: ${error}`);
      return { success: false, error };
    }
  }

  @SubscribeMessage('join-meet')
  async handleJoinMeet(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: JoinMeetEventData,
  ) {
    try {
      const { meetId, user } = data;
      const userId = client.data.userId;

      // Validate input
      if (!meetId || !user || userId !== user.id) {
        throw new Error('Invalid join request');
      }

      const meeting = this.videoCallService.getMeeting(meetId);
      if (!meeting) {
        client.emit('meet-not-found');
        throw new Error('Meeting not found');
      }

      // Check if user is already in another meeting
      if (this.videoCallService.isUserInMeeting(userId)) {
        throw new Error('User already in a meeting');
      }

      // Add user to meeting and notify others
      await this.videoCallService.addParticipantToMeeting(meetId, userId);
      client.join(meetId);

      // Get updated participants list
      const participants = this.videoCallService.getMeetingParticipants(meetId);

      // Notify others in the room
      this.server.to(meetId).emit('new-user-joined', { user });

      // Send meeting data to joining user
      client.emit('meet-joined', {
        meetId,
        meetName: meeting.name,
        users: participants,
        isHost: meeting.createdBy === userId,
      });

      return { success: true, meetName: meeting.name };
    } catch (error) {
      this.logger.error(`Error joining meeting: ${error}`);
      return { success: false, error: error?.toString() };
    }
  }

  @SubscribeMessage('signal')
  async handleSignal(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: SignalEventData,
  ) {
    try {
      const { to, from, signal, meetId } = data;

      // Validate input
      if (!meetId || !to || !from || !signal) {
        throw new Error('Invalid signal data');
      }

      // Verify both users are in the meeting
      const meeting = this.videoCallService.getMeeting(meetId);
      if (!meeting?.participants.has(to) || !meeting.participants.has(from)) {
        throw new Error('One or both users not in meeting');
      }

      // Send signal to specific user
      await this.server
        .to(`user:${to}`)
        .emit('signal', { from, signal, meetId });

      return { success: true };
    } catch (error) {
      this.logger.error(`Error handling signal: ${error}`);
      return { success: false, error: error?.toString() };
    }
  }

  @SubscribeMessage('reject-call')
  handleRejectCall(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: RejectCallEventData,
  ) {
    try {
      const { to, from } = data;
      if (!to || !from) {
        throw new Error('Invalid reject call data');
      }
      client.to(to).emit('call-rejected', { from });
      this.logger.log(`Call rejected by ${from.id} to ${to}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Error rejecting call: ${error}`);
      return { success: false, error };
    }
  }

  @SubscribeMessage('cancel-meet-request')
  handleCancelMeetRequest(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: CancelMeetRequestEventData,
  ) {
    try {
      const { meetId } = data;
      if (!meetId) {
        throw new Error('Invalid meet ID');
      }
      const meeting = this.videoCallService.getMeeting(meetId);
      if (!meeting) {
        throw new Error('Meeting not found');
      }

      this.videoCallService.removeMeeting(meetId);
      this.server.to(meetId).emit('call-canceled');
      this.logger.log(`Meeting request canceled for ${meetId}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Error canceling meeting request: ${error}`);
      return { success: false, error };
    }
  }

  @SubscribeMessage('meet-new-name')
  handleMeetNewName(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: MeetRenameEventData,
  ) {
    try {
      const { meetId, newMeetName } = data;
      if (!meetId || !newMeetName) {
        throw new Error('Invalid rename data');
      }
      const updatedMeeting = this.videoCallService.renameMeeting(
        meetId,
        newMeetName,
      );

      if (updatedMeeting) {
        this.server.to(meetId).emit('meet-name-updated', { name: newMeetName });
        this.logger.log(`Meeting ${meetId} renamed to ${newMeetName}`);
        return { success: true };
      }

      throw new Error('Meeting not found');
    } catch (error) {
      this.logger.error(`Error renaming meeting: ${error}`);
      return { success: false, error };
    }
  }

  @SubscribeMessage('update-user-audio')
  handleUpdateUserAudio(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: MediaToggleEventData,
  ) {
    try {
      const { userId, meetId, status } = data;
      if (!userId || !meetId) {
        throw new Error('Invalid audio update data');
      }
      this.server.to(meetId).emit('user-audio-update', { userId, status });
      this.logger.log(
        `User ${userId} audio updated to ${status} in meeting ${meetId}`,
      );
      return { success: true };
    } catch (error) {
      this.logger.error(`Error updating user audio: ${error}`);
      return { success: false, error };
    }
  }

  @SubscribeMessage('update-user-video')
  handleUpdateUserVideo(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: MediaToggleEventData,
  ) {
    try {
      const { userId, meetId, status } = data;
      if (!userId || !meetId) {
        throw new Error('Invalid video update data');
      }
      this.server.to(meetId).emit('user-video-update', { userId, status });
      this.logger.log(
        `User ${userId} video updated to ${status} in meeting ${meetId}`,
      );
      return { success: true };
    } catch (error) {
      this.logger.error(`Error updating user video: ${error}`);
      return { success: false, error };
    }
  }

  @SubscribeMessage('update-screen-sharing')
  handleUpdateScreenSharing(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: ScreenSharingEventData,
  ) {
    try {
      const { userId, meetId, status } = data;
      if (!userId || !meetId) {
        throw new Error('Invalid screen sharing data');
      }
      this.server.to(meetId).emit('screen-sharing-update', { userId, status });
      this.logger.log(
        `User ${userId} screen sharing updated to ${status} in meeting ${meetId}`,
      );
      return { success: true };
    } catch (error) {
      this.logger.error(`Error updating screen sharing: ${error}`);
      return { success: false, error };
    }
  }

  @SubscribeMessage('remove-from-meet')
  handleRemoveFromMeet(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: RemoveFromMeetEventData,
  ) {
    try {
      const { userId, meetId } = data;
      if (!userId || !meetId) {
        throw new Error('Invalid meeting data');
      }
      const meeting = this.videoCallService.getMeeting(meetId);
      if (!meeting) {
        throw new Error('Meeting not found');
      }

      const updatedMeeting = this.videoCallService.removeParticipantFromMeeting(
        meetId,
        userId,
      );

      if (updatedMeeting) {
        this.server.to(userId).emit('removed-from-meet');
        this.server.to(meetId).emit('other-user-left-meet', { userId });
        this.logger.log(`User ${userId} removed from meeting ${meetId}`);
        return { success: true };
      }

      throw new Error('Failed to remove user');
    } catch (error) {
      this.logger.error(`Error removing user from meeting: ${error}`);
      return { success: false, error };
    }
  }

  @SubscribeMessage('left-meet')
  handleLeftMeet(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: LeftMeetEventData,
  ) {
    try {
      const { userId, meetId } = data;
      if (!userId || !meetId) {
        throw new Error('Invalid leave data');
      }
      const meeting = this.videoCallService.getMeeting(meetId);
      if (!meeting) {
        throw new Error('Meeting not found');
      }

      const updatedMeeting = this.videoCallService.removeParticipantFromMeeting(
        meetId,
        userId,
      );

      client.leave(meetId);

      if (updatedMeeting) {
        this.server.to(meetId).emit('other-user-left-meet', { userId });
        this.logger.log(`User ${userId} left meeting ${meetId}`);
      }

      return { success: true };
    } catch (error) {
      this.logger.error(`Error leaving meeting: ${error}`);
      return { success: false, error };
    }
  }

  @SubscribeMessage('request-join-meet')
  handleRequestJoinMeet(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: RequestJoinMeetEventData,
  ) {
    try {
      const { meetId, user } = data;
      const userId = client.data.userId;

      if (!meetId || !user || userId !== user.id) {
        throw new Error('Invalid join request data');
      }

      const meeting = this.videoCallService.getMeeting(meetId);
      if (!meeting) {
        client.emit('meet-not-found');
        throw new Error('Meeting not found');
      }

      // If user is host, they can join directly without request
      if (meeting.createdBy === userId) {
        // Add user to meeting directly
        this.videoCallService.addParticipantToMeeting(meetId, userId);
        client.join(meetId);

        const participants = Array.from(meeting.participants.values())
          .map((id) => this.videoCallService.getUser(id))
          .filter((u) => !!u) as User[];

        client.emit('meet-joined', {
          meetId,
          meetName: meeting.name,
          users: participants,
          isHost: false,
        });

        this.logger.log(`Host ${userId} joined meeting directly ${meetId}`);
        return { success: true, directJoin: true, isHost: true };
      }

      // Check if user is already in the meeting
      if (meeting.participants.has(userId)) {
        client.join(meetId);

        const participants = Array.from(meeting.participants.values())
          .map((id) => this.videoCallService.getUser(id))
          .filter((u) => !!u) as User[];

        client.emit('meet-joined', {
          meetId,
          meetName: meeting.name,
          users: participants,
          isHost: false,
        });

        this.logger.log(
          `User ${userId} already approved, joined meeting ${meetId}`,
        );
        return { success: true, directJoin: true, isHost: false };
      }

      if (this.videoCallService.isUserInMeeting(userId)) {
        throw new Error('User already in a meeting');
      }

      if (this.videoCallService.hasPendingJoinRequest(userId, meetId)) {
        throw new Error('User already has a pending request for this meeting');
      }

      const requestId = uuidv4();

      const request = this.videoCallService.createJoinRequest(
        requestId,
        meetId,
        userId,
        user,
        (joinRequest: JoinRequest) => {
          // This is the timeout callback
          // Notify the host about the timeout
          // const hostId = this.videoCallService.getMeeting(meetId)?.createdBy;
          console.log(
            `Join request ${joinRequest.id} timed out for user ${joinRequest.userId} to meeting ${joinRequest.meetingId}`,
          );
          if (meeting.createdBy) {
            this.server
              .to(`user:${meeting.createdBy}`)
              .emit('join-request-timeout', {
                requestId,
                user,
                meetId,
                meetName: this.videoCallService.getMeeting(meetId)?.name,
              });
          }

          client.emit('join-request-timeout', { meetId, requestId });

          this.logger.log(
            `Join request timed out for user ${userId} to meeting ${meetId}`,
          );
        },
      );

      if (!request) {
        throw new Error('Failed to create join request');
      }

      // Notify the meeting host about the join request
      // Use the host ID with the user: prefix to target the specific user
      const hostId = meeting.createdBy;
      this.server.to(`user:${hostId}`).emit('join-request-received', {
        requestId,
        meetId,
        meetName: meeting.name,
        user,
      });

      client.emit('join-request-sent', {
        requestId,
        meetId,
        meetName: meeting.name,
      });

      this.logger.log(`User ${userId} requested to join meeting ${meetId}`);
      return { success: true, requestId, pending: true };
    } catch (error) {
      this.logger.error(`Error requesting to join meeting: ${error}`);
      return { success: false, error: error?.toString() };
    }
  }

  @SubscribeMessage('approve-join-request')
  handleApproveJoinRequest(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: ApproveJoinRequestEventData,
  ) {
    try {
      const { requestId, meetId, userId } = data;
      const hostId = client.data.userId;

      if (!requestId || !meetId || !userId || !hostId) {
        throw new Error('Invalid approve join request data');
      }

      const meeting = this.videoCallService.getMeeting(meetId);
      if (!meeting) {
        throw new Error('Meeting not found');
      }

      if (meeting.createdBy !== hostId) {
        throw new Error('Only the host can approve join requests');
      }

      const request = this.videoCallService.getJoinRequest(requestId);
      if (!request) {
        throw new Error('Join request not found');
      }

      // Add the user to the meeting participants
      this.videoCallService.addParticipantToMeeting(meetId, userId);

      // Remove the request
      this.videoCallService.removeJoinRequest(requestId);

      // Get user object for notifications
      const user = this.videoCallService.getUser(userId);
      if (user) {
        // Notify all meeting participants about the new user (except the joining user)
        this.server.to(meetId).except(userId).emit('new-user-joined', { user });
      }

      // Notify the user that their request was approved
      this.server.to(`user:${userId}`).emit('join-meet-approved', {
        requestId,
        meetId,
        meetName: meeting.name,
      });

      this.logger.log(`Join request ${requestId} approved by host ${hostId}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Error approving join request: ${error}`);
      return { success: false, error: error?.toString() };
    }
  }

  @SubscribeMessage('reject-join-request')
  handleRejectJoinRequest(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: RejectJoinRequestEventData,
  ) {
    try {
      const { requestId, meetId, userId } = data;
      const hostId = client.data.userId;

      if (!requestId || !meetId || !userId || !hostId) {
        throw new Error('Invalid reject join request data');
      }

      const meeting = this.videoCallService.getMeeting(meetId);
      if (!meeting) {
        throw new Error('Meeting not found');
      }

      if (meeting.createdBy !== hostId) {
        throw new Error('Only the host can reject join requests');
      }

      const request = this.videoCallService.getJoinRequest(requestId);
      if (!request) {
        throw new Error('Join request not found');
      }

      // Remove the request
      this.videoCallService.removeJoinRequest(requestId);

      // Notify the user that their request was rejected
      this.server.to(`user:${userId}`).emit('join-request-rejected', {
        requestId,
        meetId,
      });

      this.logger.log(`Join request ${requestId} rejected by host ${hostId}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Error rejecting join request: ${error}`);
      return { success: false, error: error?.toString() };
    }
  }

  @SubscribeMessage('cancel-join-request')
  handleCancelJoinRequest(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: CancelJoinRequestEventData,
  ) {
    try {
      const { requestId, meetId } = data;
      const userId = client.data.userId;

      if (!requestId || !meetId || !userId) {
        throw new Error('Invalid cancel join request data');
      }

      const request = this.videoCallService.getJoinRequest(requestId);
      if (!request) {
        throw new Error('Join request not found');
      }

      if (request.userId !== userId) {
        throw new Error('Only the user who created the request can cancel it');
      }

      // Remove the request
      this.videoCallService.removeJoinRequest(requestId);

      // Notify the meeting participants that the request was canceled
      this.server.to(meetId).emit('join-request-canceled', {
        requestId,
        meetId,
        userId,
      });

      this.logger.log(`Join request ${requestId} canceled by user ${userId}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Error canceling join request: ${error}`);
      return { success: false, error: error?.toString() };
    }
  }

  @SubscribeMessage('join-after-approval')
  handleJoinAfterApproval(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { meetId: string; requestId: string },
  ) {
    try {
      const { meetId } = data;
      const userId = client.data.userId;

      if (!meetId || !userId) {
        throw new Error('Invalid join data');
      }

      const meeting = this.videoCallService.getMeeting(meetId);
      if (!meeting) {
        throw new Error('Meeting not found');
      }

      if (!meeting.participants.has(userId)) {
        throw new Error('User not approved to join this meeting');
      }

      // Join the socket room
      client.join(meetId);

      const participants = Array.from(meeting.participants.values())
        .map((id) => this.videoCallService.getUser(id))
        .filter((u) => !!u) as User[];

      // Get the user object
      const user = this.videoCallService.getUser(userId);

      if (user) {
        // Notify all other participants about the new user
        client.to(meetId).emit('new-user-joined', { user });
      }

      // Send meeting data to the joining user
      client.emit('meet-joined', {
        meetId,
        meetName: meeting.name,
        users: participants,
        isHost: meeting.createdBy === userId,
      });

      this.logger.log(`User ${userId} joined meeting ${meetId} after approval`);
      return { success: true, meetName: meeting.name };
    } catch (error) {
      this.logger.error(`Error joining after approval: ${error}`);
      return { success: false, error: error?.toString() };
    }
  }
}
