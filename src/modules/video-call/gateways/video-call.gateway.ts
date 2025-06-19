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
import { VideoCallService } from '../services/video-call.service';
import { User, Meeting, JoinRequest } from '../interfaces/meeting.interface';
import {
  SignalEventData,
  CreateMeetEventData,
  JoinMeetEventData,
  MeetRenameEventData,
  MediaToggleEventData,
  ScreenSharingEventData,
  ChatMessageEventData,
  RemoveFromMeetEventData,
  LeftMeetEventData,
  RejectCallEventData,
  CancelMeetRequestEventData,
  RequestJoinMeetEventData,
  ApproveJoinRequestEventData,
  RejectJoinRequestEventData,
  CancelJoinRequestEventData,
} from '../interfaces/call-events.interface';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  namespace: 'video-call',
  transports: ['websocket', 'polling'],
})
export class VideoCallGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(VideoCallGateway.name);

  constructor(private readonly videoCallService: VideoCallService) {}

  async handleConnection(client: Socket) {
    try {
      this.logger.log(`Client connected: ${client.id}`);
      client.join(`user:${client.id}`);
      client.emit('FE-connection-established', {
        socketId: client.id,
        message: 'Connected to video-call namespace',
      });
    } catch (error) {
      this.logger.error(`Error in handleConnection: ${error}`);
    }
  }

  async handleDisconnect(client: Socket) {
    try {
      const userId = client.data.userId || client.id;
      this.logger.log(`Client disconnecting: ${client.id} (User: ${userId})`);
      client.leave(`user:${userId}`);
      const meeting = this.videoCallService.getUserMeeting(userId);
      if (meeting) {
        const updatedMeeting =
          this.videoCallService.removeParticipantFromMeeting(
            meeting.id,
            userId,
          );
        if (updatedMeeting) {
          const user = this.videoCallService.getUser(userId);
          const isHost = meeting.createdBy === userId;
          await this.server.to(meeting.id).emit('FE-other-user-left-meet', {
            userId,
            isHost,
          });
          client.leave(meeting.id);
          this.logger.log(`User ${userId} removed from meeting ${meeting.id}`);
        } else {
          this.logger.log(
            `Meeting ${meeting.id} removed - no participants left`,
          );
        }
      }
      setTimeout(() => {
        if (!this.videoCallService.isUserInAnyMeeting(userId)) {
          this.videoCallService.removeUser(userId);
          this.logger.log(
            `User data removed for ${userId} after disconnect timeout`,
          );
        }
      }, 30000);
    } catch (error) {
      this.logger.error(
        `Error handling disconnect: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  @SubscribeMessage('BE-save-user-data')
  handleSaveUserData(
    @ConnectedSocket() client: Socket,
    @MessageBody() userData: User,
  ) {
    try {
      if (!userData || !userData.id || !userData.name || !userData.email) {
        throw new Error('Invalid user data');
      }
      this.videoCallService.saveUser(userData);
      client.data.userId = userData.id;
      client.join(`user:${userData.id}`);
      this.logger.log(`User data saved for ${userData.id} (${userData.name})`);
      return { success: true, user: userData, socketId: client.id };
    } catch (error) {
      this.logger.error(`Error saving user data: ${error}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  @SubscribeMessage('BE-create-meet')
  handleCreateMeet(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: CreateMeetEventData,
  ) {
    try {
      const { meetId, meetName } = data;
      let creatorId = client.data.userId || client.id;
      if (!creatorId) {
        creatorId = client.id;
        client.data.userId = creatorId;
        this.videoCallService.saveUser({
          id: creatorId,
          name: `Host-${client.id.substring(0, 5)}`,
          email: `host-${client.id.substring(0, 5)}@example.com`,
          isHost: true,
        });
      }
      if (!meetId || !meetName) {
        throw new Error('Invalid meeting data');
      }
      if (this.videoCallService.isUserInMeeting(creatorId)) {
        throw new Error('User already in a meeting');
      }
      this.videoCallService.createMeeting(meetId, meetName, creatorId);
      this.videoCallService.addParticipantToMeeting(meetId, creatorId);
      client.join(meetId);
      this.logger.log(
        `Meeting created: ${meetId} (${meetName}) by user ${creatorId}`,
      );
      client.emit('FE-meet-created', { meetId, meetName, creatorId });
      return { success: true, meetId, meetName, creatorId };
    } catch (error) {
      this.logger.error(`Error creating meeting: ${error}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  @SubscribeMessage('BE-join-meet')
  async handleJoinMeet(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: JoinMeetEventData,
  ) {
    try {
      const { meetId, user } = data;
      let userId = client.data.userId || user.id || client.id;
      if (!userId || !user || !user.name || !user.email) {
        throw new Error('Invalid user data');
      }
      if (!this.videoCallService.getUser(userId)) {
        this.videoCallService.saveUser({ ...user, id: userId });
        client.data.userId = userId;
      }
      if (!meetId) {
        throw new Error('Invalid meeting ID');
      }
      const meeting = this.videoCallService.getMeeting(meetId);
      if (!meeting) {
        client.emit('FE-meet-not-found', { meetId });
        throw new Error('Meeting not found');
      }
      const currentMeeting = this.videoCallService.getUserMeeting(userId);
      if (currentMeeting && currentMeeting.id !== meetId) {
        throw new Error('User already in a different meeting');
      }
      const isRejoin = currentMeeting && currentMeeting.id === meetId;
      if (!isRejoin) {
        this.videoCallService.addParticipantToMeeting(meetId, userId);
      }
      client.join(meetId);
      const participants = this.videoCallService.getMeetingParticipants(meetId);
      const isHost = meeting.createdBy === userId;
      if (!isRejoin) {
        const userObj = this.videoCallService.getUser(userId);
        this.server
          .to(meetId)
          .except(`user:${userId}`)
          .emit('FE-new-user-joined', { user: userObj });
      }
      client.emit('FE-meet-joined', {
        meetId,
        meetName: meeting.name,
        users: participants,
        isHost,
      });
      this.logger.log(
        `User ${userId} ${isRejoin ? 're-joined' : 'joined'} meeting ${meetId}${isHost ? ' as host' : ''}`,
      );
      return { success: true, meetName: meeting.name, isHost, isRejoin };
    } catch (error) {
      this.logger.error(`Error joining meeting: ${error}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  @SubscribeMessage('BE-signal')
  async handleSignal(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: SignalEventData,
  ) {
    try {
      const { to, from, signal, meetId } = data;
      if (!meetId || !to || !from || !signal) {
        throw new Error('Invalid signal data');
      }
      const meeting = this.videoCallService.getMeeting(meetId);
      if (
        !meeting ||
        !meeting.participants.has(from) ||
        !meeting.participants.has(to)
      ) {
        throw new Error('One or both users not in meeting');
      }
      const fromUser = this.videoCallService.getUser(from);
      this.server.to(`user:${to}`).emit('FE-signal', {
        from,
        signal,
        meetId,
        info: { userName: fromUser?.name || from },
      });
      this.logger.log(`Signal sent from ${from} to ${to} in meeting ${meetId}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Error handling signal: ${error}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  @SubscribeMessage('BE-send-message')
  handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: ChatMessageEventData,
  ) {
    try {
      const { meetId, message, from, timestamp } = data;
      if (!meetId || !message || !from || !from.id) {
        throw new Error('Invalid message data');
      }
      const meeting = this.videoCallService.getMeeting(meetId);
      if (!meeting || !meeting.participants.has(from.id)) {
        throw new Error('User not in meeting');
      }
      this.server.to(meetId).emit('FE-new-message', {
        meetId,
        message,
        from,
        timestamp: timestamp || new Date().toISOString(),
      });
      this.logger.log(
        `Message sent in meeting ${meetId} by ${from.id}: ${message.substring(0, 50)}...`,
      );
      return { success: true };
    } catch (error) {
      this.logger.error(`Error sending message: ${error}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  @SubscribeMessage('BE-reject-call')
  handleRejectCall(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: RejectCallEventData,
  ) {
    try {
      const { to, from } = data;
      if (!to || !from || !from.id) {
        throw new Error('Invalid reject call data');
      }
      this.server.to(`user:${to}`).emit('FE-call-rejected', { from });
      this.logger.log(`Call rejected by ${from.id} to ${to}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Error rejecting call: ${error}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  @SubscribeMessage('BE-cancel-meet-request')
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
      this.server.to(meetId).emit('FE-call-canceled', { meetId });
      this.logger.log(`Meeting request canceled for ${meetId}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Error canceling meeting request: ${error}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  @SubscribeMessage('BE-meet-new-name')
  handleMeetNewName(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: MeetRenameEventData,
  ) {
    try {
      const { meetId, newMeetName } = data;
      const userId = client.data.userId;
      if (!meetId || !newMeetName || !userId) {
        throw new Error('Invalid rename data');
      }
      const meeting = this.videoCallService.getMeeting(meetId);
      if (!meeting || meeting.createdBy !== userId) {
        throw new Error('Only host can rename meeting');
      }
      const updatedMeeting = this.videoCallService.renameMeeting(
        meetId,
        newMeetName,
      );
      if (updatedMeeting) {
        this.server
          .to(meetId)
          .emit('FE-meet-name-updated', { meetId, name: newMeetName });
        this.logger.log(`Meeting ${meetId} renamed to ${newMeetName}`);
        return { success: true };
      }
      throw new Error('Meeting not found');
    } catch (error) {
      this.logger.error(`Error renaming meeting: ${error}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  @SubscribeMessage('BE-update-user-audio')
  handleUpdateUserAudio(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: MediaToggleEventData,
  ) {
    try {
      const { userId, meetId, status } = data;
      if (!userId || !meetId) {
        throw new Error('Invalid audio update data');
      }
      const meeting = this.videoCallService.getMeeting(meetId);
      if (!meeting || !meeting.participants.has(userId)) {
        throw new Error('User not in meeting');
      }
      this.videoCallService.updateUserMedia(userId, 'audio', status);
      this.server.to(meetId).emit('FE-user-audio-update', { userId, status });
      this.logger.log(
        `User ${userId} audio updated to ${status} in meeting ${meetId}`,
      );
      return { success: true };
    } catch (error) {
      this.logger.error(`Error updating user audio: ${error}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  @SubscribeMessage('BE-update-user-video')
  handleUpdateUserVideo(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: MediaToggleEventData,
  ) {
    try {
      const { userId, meetId, status } = data;
      if (!userId || !meetId) {
        throw new Error('Invalid video update data');
      }
      const meeting = this.videoCallService.getMeeting(meetId);
      if (!meeting || !meeting.participants.has(userId)) {
        throw new Error('User not in meeting');
      }
      this.videoCallService.updateUserMedia(userId, 'video', status);
      this.server.to(meetId).emit('FE-user-video-update', { userId, status });
      this.logger.log(
        `User ${userId} video updated to ${status} in meeting ${meetId}`,
      );
      return { success: true };
    } catch (error) {
      this.logger.error(`Error updating user video: ${error}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  @SubscribeMessage('BE-update-screen-sharing')
  handleUpdateScreenSharing(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: ScreenSharingEventData,
  ) {
    try {
      const { userId, meetId, status } = data;
      if (!userId || !meetId) {
        throw new Error('Invalid screen sharing data');
      }
      const meeting = this.videoCallService.getMeeting(meetId);
      if (!meeting || !meeting.participants.has(userId)) {
        throw new Error('User not in meeting');
      }
      this.server
        .to(meetId)
        .emit('FE-screen-sharing-update', { userId, status });
      this.logger.log(
        `User ${userId} screen sharing updated to ${status} in meeting ${meetId}`,
      );
      return { success: true };
    } catch (error) {
      this.logger.error(`Error updating screen sharing: ${error}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  @SubscribeMessage('BE-remove-from-meet')
  handleRemoveFromMeet(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: RemoveFromMeetEventData,
  ) {
    try {
      const { userId, meetId } = data;
      const hostId = client.data.userId;
      if (!userId || !meetId || !hostId) {
        throw new Error('Invalid remove user data');
      }
      const meeting = this.videoCallService.getMeeting(meetId);
      if (!meeting || meeting.createdBy !== hostId) {
        throw new Error('Only host can remove users');
      }
      const updatedMeeting = this.videoCallService.removeParticipantFromMeeting(
        meetId,
        userId,
      );
      if (updatedMeeting) {
        this.server
          .to(`user:${userId}`)
          .emit('FE-removed-from-meet', { meetId });
        this.server.to(meetId).emit('FE-other-user-left-meet', { userId });
        this.logger.log(
          `User ${userId} removed from meeting ${meetId} by host ${hostId}`,
        );
        return { success: true };
      }
      throw new Error('Failed to remove user');
    } catch (error) {
      this.logger.error(`Error removing user from meeting: ${error}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  @SubscribeMessage('BE-left-meet')
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
        this.server.to(meetId).emit('FE-other-user-left-meet', {
          userId,
          isHost: meeting.createdBy === userId,
        });
        this.logger.log(`User ${userId} left meeting ${meetId}`);
      }
      return { success: true };
    } catch (error) {
      this.logger.error(`Error leaving meeting: ${error}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  @SubscribeMessage('BE-request-join-meet')
  handleRequestJoinMeet(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: RequestJoinMeetEventData,
  ) {
    try {
      const { meetId, user } = data;
      const userId = client.data.userId || user.id;
      if (!meetId || !user || !userId || userId !== user.id) {
        throw new Error('Invalid join request data');
      }
      const meeting = this.videoCallService.getMeeting(meetId);
      if (!meeting) {
        client.emit('FE-meet-not-found', { meetId });
        throw new Error('Meeting not found');
      }
      if (meeting.createdBy === userId || meeting.participants.has(userId)) {
        this.videoCallService.addParticipantToMeeting(meetId, userId);
        client.join(meetId);
        const participants =
          this.videoCallService.getMeetingParticipants(meetId);
        client.emit('FE-meet-joined', {
          meetId,
          meetName: meeting.name,
          users: participants,
          isHost: meeting.createdBy === userId,
        });
        this.server
          .to(meetId)
          .except(`user:${userId}`)
          .emit('FE-new-user-joined', { user });
        this.logger.log(`Host ${userId} joined meeting directly ${meetId}`);
        return {
          success: true,
          directJoin: true,
          isHost: meeting.createdBy === userId,
        };
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
          this.server
            .to(`user:${meeting.createdBy}`)
            .emit('FE-join-request-timeout', {
              requestId,
              user,
              meetId,
              meetName: meeting.name,
            });
          client.emit('FE-join-request-timeout', { meetId, requestId });
          this.logger.log(
            `Join request timed out for user ${userId} to meeting ${meetId}`,
          );
        },
      );
      if (!request) {
        throw new Error('Failed to create join request');
      }
      this.server
        .to(`user:${meeting.createdBy}`)
        .emit('FE-join-request-received', {
          requestId,
          meetId,
          meetName: meeting.name,
          user,
        });
      client.emit('FE-join-request-sent', {
        requestId,
        meetId,
        meetName: meeting.name,
      });
      this.logger.log(`User ${userId} requested to join meeting ${meetId}`);
      return { success: true, requestId, pending: true };
    } catch (error) {
      this.logger.error(`Error requesting to join meeting: ${error}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  @SubscribeMessage('BE-approve-join-request')
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
      if (!meeting || meeting.createdBy !== hostId) {
        throw new Error('Only the host can approve join requests');
      }
      const request = this.videoCallService.getJoinRequest(requestId);
      if (!request) {
        throw new Error('Join request not found');
      }
      this.videoCallService.addParticipantToMeeting(meetId, userId);
      this.videoCallService.removeJoinRequest(requestId);
      const user = this.videoCallService.getUser(userId);
      if (user) {
        this.server
          .to(meetId)
          .except(`user:${userId}`)
          .emit('FE-new-user-joined', { user });
      }
      this.server.to(`user:${userId}`).emit('FE-join-meet-approved', {
        requestId,
        meetId,
        meetName: meeting.name,
      });
      this.logger.log(`Join request ${requestId} approved by host ${hostId}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Error approving join request: ${error}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  @SubscribeMessage('BE-reject-join-request')
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
      if (!meeting || meeting.createdBy !== hostId) {
        throw new Error('Only the host can reject join requests');
      }
      const request = this.videoCallService.getJoinRequest(requestId);
      if (!request) {
        throw new Error('Join request not found');
      }
      this.videoCallService.removeJoinRequest(requestId);
      this.server.to(`user:${userId}`).emit('FE-join-request-rejected', {
        requestId,
        meetId,
      });
      this.logger.log(`Join request ${requestId} rejected by host ${hostId}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Error rejecting join request: ${error}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  @SubscribeMessage('BE-cancel-join-request')
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
      if (!request || request.userId !== userId) {
        throw new Error('Only the user who created the request can cancel it');
      }
      this.videoCallService.removeJoinRequest(requestId);
      this.server.to(meetId).emit('FE-join-request-canceled', {
        requestId,
        meetId,
        userId,
      });
      this.logger.log(`Join request ${requestId} canceled by user ${userId}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Error canceling join request: ${error}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  @SubscribeMessage('BE-join-after-approval')
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
      if (!meeting || !meeting.participants.has(userId)) {
        throw new Error('User not approved to join this meeting');
      }
      client.join(meetId);
      const participants = this.videoCallService.getMeetingParticipants(meetId);
      const user = this.videoCallService.getUser(userId);
      if (user) {
        this.server
          .to(meetId)
          .except(`user:${userId}`)
          .emit('FE-new-user-joined', { user });
      }
      client.emit('FE-meet-joined', {
        meetId,
        meetName: meeting.name,
        users: participants,
        isHost: meeting.createdBy === userId,
      });
      this.logger.log(`User ${userId} joined meeting ${meetId} after approval`);
      return { success: true, meetName: meeting.name };
    } catch (error) {
      this.logger.error(`Error joining after approval: ${error}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
