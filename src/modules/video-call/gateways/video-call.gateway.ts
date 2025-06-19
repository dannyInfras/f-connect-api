// src/video-call.gateway.ts
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

// Define interfaces for Express server events
interface CheckUserEventData {
  roomId: string;
  userName: string;
}

interface JoinRoomEventData {
  roomId: string;
  userName: string;
}

interface CallUserEventData {
  userToCall: string;
  from: string;
  signal: any;
}

interface AcceptCallEventData {
  signal: any;
  to: string;
}

interface SendMessageEventData {
  roomId: string;
  msg: string;
  sender: string;
}

interface LeaveRoomEventData {
  roomId: string;
  leaver: string;
}

interface ToggleCameraAudioEventData {
  roomId: string;
  switchTarget: 'video' | 'audio';
}

// Existing interfaces (kept for brevity, as provided)
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
    origin: '*', // Allow all origins for better compatibility
    methods: ['GET', 'POST'],
    credentials: true,
  },
  namespace: 'video-call',
  transports: ['websocket', 'polling'], // Support both WebSocket and polling
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
      // Create a user-specific room for direct messaging
      client.join(`user:${client.id}`);

      // Send connection acknowledgment to client
      client.emit('connection-established', {
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

      // Leave user-specific room
      client.leave(`user:${userId}`);

      // Check if user is in a meeting
      const meeting = this.videoCallService.getUserMeeting(userId);
      if (meeting) {
        // Remove from meeting
        const updatedMeeting =
          this.videoCallService.removeParticipantFromMeeting(
            meeting.id,
            userId,
          );

        // If meeting still exists after removal
        if (updatedMeeting) {
          // Get user details
          const user = this.videoCallService.getUser(userId);
          const userName = user?.name || userId;
          const isHost = meeting.createdBy === userId;

          // Notify others that user left
          await this.server.to(meeting.id).emit('other-user-left-meet', {
            userId,
            isHost,
          });

          // Also emit legacy event
          await this.server.to(meeting.id).emit('FE-user-leave', {
            userId,
            userName,
          });

          // Leave meeting room
          client.leave(meeting.id);

          this.logger.log(`User ${userId} removed from meeting ${meeting.id}`);
        } else {
          this.logger.log(
            `Meeting ${meeting.id} removed - no participants left`,
          );
        }
      }

      // Keep user data for reconnection attempts
      // Only remove after a timeout or if explicitly requested
      setTimeout(() => {
        // Check if user has reconnected
        if (!this.videoCallService.isUserInAnyMeeting(userId)) {
          this.videoCallService.removeUser(userId);
          this.logger.log(
            `User data removed for ${userId} after disconnect timeout`,
          );
        }
      }, 30000); // 30 second grace period for reconnection
    } catch (error) {
      this.logger.error(
        `Error handling disconnect: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  @SubscribeMessage('BE-check-user')
  handleCheckUser(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: CheckUserEventData,
  ) {
    try {
      const { roomId, userName } = data;
      if (!roomId || !userName) {
        throw new Error('Invalid check user data');
      }

      const meeting = this.videoCallService.getMeeting(roomId);
      if (!meeting) {
        return { error: false }; // No meeting exists, so no user conflict
      }

      const participants = this.videoCallService.getMeetingParticipants(roomId);
      const error = participants.some((user: any) => user.name === userName);

      this.logger.debug(
        `Checked user ${userName} in room ${roomId}: ${error ? 'exists' : 'not found'}`,
      );
      return { error };
    } catch (error) {
      this.logger.error(`Error checking user: ${error}`);
      return { error: true };
    }
  }

  @SubscribeMessage('BE-join-room')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: JoinRoomEventData,
  ) {
    try {
      const { roomId, userName } = data;
      const userId = client.data.userId || client.id;

      if (!roomId || !userName) {
        throw new Error('Invalid join room data');
      }

      let meeting = this.videoCallService.getMeeting(roomId);
      if (!meeting) {
        // Create a new meeting if it doesn't exist (simulating Express behavior)
        this.videoCallService.createMeeting(roomId, `Room ${roomId}`, userId);
        meeting = this.videoCallService.getMeeting(roomId)!;
      }

      const user: User = {
        id: userId,
        name: userName,
        email: `${userName}@example.com`, // Placeholder email
        isHost: meeting.createdBy === userId,
      };

      if (this.videoCallService.isUserInMeeting(userId)) {
        throw new Error('User already in a meeting');
      }

      // Save user data
      this.videoCallService.saveUser(user);
      client.data.userId = userId;

      // Add participant to meeting
      this.videoCallService.addParticipantToMeeting(roomId, userId);
      client.join(roomId);

      // Get updated participants
      const participants = this.videoCallService.getMeetingParticipants(roomId);
      const users = participants.map((u: any) => ({
        userId: u.id,
        info: { userName: u.name, video: true, audio: true },
      }));

      // Notify others in the room
      this.server
        .to(roomId)
        .except(`user:${userId}`)
        .emit('FE-user-join', users);
      this.server
        .to(roomId)
        .except(`user:${userId}`)
        .emit('new-user-joined', { user });

      this.logger.log(`User ${userName} (${userId}) joined room ${roomId}`);
      return { success: true, users };
    } catch (error) {
      this.logger.error(`Error joining room: ${error}`);
      return { success: false, error: error };
    }
  }

  @SubscribeMessage('BE-call-user')
  handleCallUser(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: CallUserEventData,
  ) {
    try {
      const { userToCall, from, signal } = data;
      if (!userToCall || !from || !signal) {
        throw new Error('Invalid call user data');
      }

      const meeting = this.videoCallService.getUserMeeting(from);
      if (!meeting || !meeting.participants.has(userToCall)) {
        throw new Error('One or both users not in the same meeting');
      }

      const user = this.videoCallService.getUser(from);
      if (!user) {
        throw new Error('Caller not found');
      }

      this.server.to(`user:${userToCall}`).emit('FE-receive-call', {
        signal,
        from,
        info: { userName: user.name, video: true, audio: true },
      });

      this.logger.log(`Call initiated from ${from} to ${userToCall}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Error calling user: ${error}`);
      return { success: false, error: error };
    }
  }

  @SubscribeMessage('BE-accept-call')
  handleAcceptCall(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: AcceptCallEventData,
  ) {
    try {
      const { signal, to } = data;
      if (!signal || !to) {
        throw new Error('Invalid accept call data');
      }

      const meeting = this.videoCallService.getUserMeeting(client.data.userId);
      if (!meeting || !meeting.participants.has(to)) {
        throw new Error('One or both users not in the same meeting');
      }

      this.server.to(`user:${to}`).emit('FE-call-accepted', {
        signal,
        answerId: client.id,
      });

      this.logger.log(`Call accepted by ${client.id} to ${to}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Error accepting call: ${error}`);
      return { success: false, error: error };
    }
  }

  @SubscribeMessage('BE-send-message')
  handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: SendMessageEventData,
  ) {
    try {
      const { roomId, msg, sender } = data;
      if (!roomId || !msg || !sender) {
        throw new Error('Invalid message data');
      }

      const meeting = this.videoCallService.getMeeting(roomId);
      if (!meeting || !meeting.participants.has(client.data.userId)) {
        throw new Error('User not in meeting');
      }

      this.server.to(roomId).emit('FE-receive-message', { msg, sender });
      this.server.to(roomId).emit('new-message', {
        meetId: roomId,
        message: msg,
        from: this.videoCallService.getUser(client.data.userId) || {
          id: client.id,
          name: sender,
          email: '',
        },
        timestamp: new Date().toISOString(),
      });

      this.logger.debug(
        `Message sent in room ${roomId} by ${sender}: ${msg.substring(0, 50)}...`,
      );
      return { success: true };
    } catch (error) {
      this.logger.error(`Error sending message: ${error}`);
      return { success: false, error: error };
    }
  }

  @SubscribeMessage('BE-leave-room')
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: LeaveRoomEventData,
  ) {
    try {
      const { roomId, leaver } = data;
      const userId = client.data.userId || client.id;

      if (!roomId || !leaver) {
        throw new Error('Invalid leave room data');
      }

      const meeting = this.videoCallService.getMeeting(roomId);
      if (!meeting) {
        throw new Error('Meeting not found');
      }

      const updatedMeeting = this.videoCallService.removeParticipantFromMeeting(
        roomId,
        userId,
      );
      client.leave(roomId);

      if (updatedMeeting) {
        this.server
          .to(roomId)
          .emit('FE-user-leave', { userId, userName: leaver });
        this.server.to(roomId).emit('other-user-left-meet', { userId });
        this.logger.log(`User ${leaver} (${userId}) left room ${roomId}`);
      }

      return { success: true };
    } catch (error) {
      this.logger.error(`Error leaving room: ${error}`);
      return { success: false, error: error };
    }
  }

  @SubscribeMessage('BE-toggle-camera-audio')
  handleToggleCameraAudio(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: ToggleCameraAudioEventData,
  ) {
    try {
      const { roomId, switchTarget } = data;
      const userId = client.data.userId || client.id;

      if (!roomId || !switchTarget) {
        throw new Error('Invalid toggle data');
      }

      const meeting = this.videoCallService.getMeeting(roomId);
      if (!meeting || !meeting.participants.has(userId)) {
        throw new Error('User not in meeting');
      }

      this.server.to(roomId).emit('FE-toggle-camera', { userId, switchTarget });
      this.server
        .to(roomId)
        .emit(
          switchTarget === 'video' ? 'user-video-update' : 'user-audio-update',
          {
            userId,
            status: true, // Assume toggle enables; adjust if needed
          },
        );

      this.logger.log(
        `User ${userId} toggled ${switchTarget} in room ${roomId}`,
      );
      return { success: true };
    } catch (error) {
      this.logger.error(`Error toggling camera/audio: ${error}`);
      return { success: false, error: error };
    }
  }

  // Existing NestJS handlers (updated for compatibility)
  @SubscribeMessage('save-user-data')
  handleSaveUserData(
    @ConnectedSocket() client: Socket,
    @MessageBody() userData: User,
  ) {
    try {
      // Validate user data
      if (!userData || typeof userData !== 'object') {
        throw new Error('Invalid user data format');
      }

      // If no ID provided, use socket ID
      if (!userData.id) {
        userData.id = client.id;
      }

      // If no name provided, use a default
      if (!userData.name) {
        userData.name = `User-${client.id.substring(0, 5)}`;
      }

      // If no email provided, create a placeholder
      if (!userData.email) {
        userData.email = `${userData.name.replace(/\s+/g, '').toLowerCase()}@example.com`;
      }

      // Save user data to service
      this.videoCallService.saveUser(userData);

      // Store user ID in socket data for reference
      client.data.userId = userData.id;

      // Join user-specific room for direct messaging
      client.join(`user:${userData.id}`);

      this.logger.log(`User data saved for ${userData.id} (${userData.name})`);

      return {
        success: true,
        user: userData,
        socketId: client.id,
      };
    } catch (error) {
      this.logger.error(`Error saving user data: ${error}`);
      return {
        success: false,
        error: error instanceof Error ? error.toString() : 'Unknown error',
        socketId: client.id,
      };
    }
  }

  @SubscribeMessage('create-meet')
  handleCreateMeet(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: CreateMeetEventData,
  ) {
    try {
      const { meetId, meetName } = data;

      // Get userId from socket data or use socket ID as fallback
      let creatorId = client.data.userId;

      // If no userId stored in socket data, use socket ID and create a user
      if (!creatorId) {
        creatorId = client.id;
        client.data.userId = creatorId;

        // Create a default user record
        this.videoCallService.saveUser({
          id: creatorId,
          name: `Host-${client.id.substring(0, 5)}`,
          email: `host-${client.id.substring(0, 5)}@example.com`,
          isHost: true,
        });

        this.logger.log(
          `Created default user for meeting creator: ${creatorId}`,
        );
      }

      if (!meetId) {
        throw new Error('Invalid meeting ID');
      }

      // Use default name if not provided
      const finalMeetName = meetName || `Meeting-${meetId.substring(0, 8)}`;

      // Check if user is already in a meeting
      if (this.videoCallService.isUserInMeeting(creatorId)) {
        throw new Error('User already in a meeting');
      }

      // Create the meeting
      this.videoCallService.createMeeting(meetId, finalMeetName, creatorId);

      // Add creator as participant
      this.videoCallService.addParticipantToMeeting(meetId, creatorId);

      // Join socket room
      client.join(meetId);

      this.logger.log(
        `Meeting created: ${meetId} (${finalMeetName}) by user ${creatorId}`,
      );

      return {
        success: true,
        meetId,
        meetName: finalMeetName,
        creatorId,
      };
    } catch (error) {
      this.logger.error(
        `Error creating meeting: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return {
        success: false,
        error: error instanceof Error ? error.toString() : 'Unknown error',
      };
    }
  }

  @SubscribeMessage('join-meet')
  async handleJoinMeet(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: JoinMeetEventData,
  ) {
    try {
      const { meetId, user } = data;

      // Use socket's userId if available, otherwise use from data
      let userId = client.data.userId;

      // If no userId in socket data but user object provided
      if (!userId && user && user.id) {
        userId = user.id;
        client.data.userId = userId;

        // Save user data if not already saved
        if (!this.videoCallService.getUser(userId)) {
          this.videoCallService.saveUser(user);
        }
      }

      // If still no userId, use socket ID
      if (!userId) {
        userId = client.id;
        client.data.userId = userId;

        // Create minimal user record
        this.videoCallService.saveUser({
          id: userId,
          name: `User-${client.id.substring(0, 5)}`,
          email: `user-${client.id.substring(0, 5)}@example.com`,
        });
      }

      if (!meetId) {
        throw new Error('Invalid meeting ID');
      }

      const meeting = this.videoCallService.getMeeting(meetId);
      if (!meeting) {
        client.emit('meet-not-found');
        throw new Error('Meeting not found');
      }

      // Check if user is already in another meeting
      const currentMeeting = this.videoCallService.getUserMeeting(userId);
      if (currentMeeting && currentMeeting.id !== meetId) {
        throw new Error('User already in a different meeting');
      }

      // If user is already in this meeting, just rejoin
      const isRejoin = currentMeeting && currentMeeting.id === meetId;

      // If not already in meeting, add them
      if (!isRejoin) {
        this.videoCallService.addParticipantToMeeting(meetId, userId);
      }

      // Join the socket room
      client.join(meetId);

      // Get all participants
      const participants = this.videoCallService.getMeetingParticipants(meetId);

      // Determine if user is host
      const isHost = meeting.createdBy === userId;

      // If not rejoining, notify others about new user
      if (!isRejoin) {
        // Get user object
        const userObj = this.videoCallService.getUser(userId);

        // Notify all other participants in the meeting
        this.server
          .to(meetId)
          .except(client.id)
          .emit('new-user-joined', { user: userObj });

        // Also emit legacy event
        this.server
          .to(meetId)
          .except(client.id)
          .emit('FE-user-join', [
            {
              userId,
              info: {
                userName: userObj?.name || userId,
                video: true,
                audio: true,
              },
            },
          ]);
      }

      // Send meeting data to joining user
      client.emit('meet-joined', {
        meetId,
        meetName: meeting.name,
        users: participants,
        isHost,
      });

      // Log the join
      this.logger.log(
        `User ${userId} ${isRejoin ? 're-joined' : 'joined'} meeting ${meetId}${isHost ? ' as host' : ''}`,
      );

      return {
        success: true,
        meetName: meeting.name,
        isHost,
        isRejoin,
      };
    } catch (error) {
      this.logger.error(`Error joining meeting: ${error}`);
      return {
        success: false,
        error: error instanceof Error ? error.toString() : 'Unknown error',
      };
    }
  }
  // video-call.gateway.ts
  @SubscribeMessage('signal')
  async handleSignal(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: SignalEventData,
  ) {
    try {
      console.log('Received signal data:', JSON.stringify(data, null, 2)); // Debug log
      const { to, from, signal, meetId } = data;

      // Validate required fields
      if (!meetId || !to || !from || !signal) {
        throw new Error(
          `Invalid signal data: missing ${!meetId ? 'meetId' : !to ? 'to' : !from ? 'from' : 'signal'}`,
        );
      }

      const meeting = this.videoCallService.getMeeting(meetId);
      if (!meeting) {
        throw new Error('Meeting not found');
      }

      if (!meeting.participants.has(from) || !meeting.participants.has(to)) {
        throw new Error('One or both users not in meeting');
      }

      const fromUser = this.videoCallService.getUser(from);
      this.server.to(`user:${to}`).emit('signal', {
        from,
        signal,
        meetId,
        info: {
          userName: fromUser?.name || from,
          video: fromUser?.video ?? true,
          audio: fromUser?.audio ?? true,
        },
      });

      this.logger.log(`Signal sent from ${from} to ${to} in meeting ${meetId}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Error handling signal: ${error}`, error);
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
      if (!to || !from) {
        throw new Error('Invalid reject call data');
      }
      this.server.to(`user:${to}`).emit('call-rejected', { from });
      this.logger.log(`Call rejected by ${from.id} to ${to}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Error rejecting call: ${error}`);
      return { success: false, error: error };
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
      return { success: false, error: error };
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
      if (!userId || !meetId) {
        throw new Error('Invalid audio update data');
      }
      this.server.to(meetId).emit('user-audio-update', { userId, status });
      this.server
        .to(meetId)
        .emit('FE-toggle-camera', { userId, switchTarget: 'audio' });
      this.logger.log(
        `User ${userId} audio updated to ${status} in meeting ${meetId}`,
      );
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
      if (!userId || !meetId) {
        throw new Error('Invalid video update data');
      }
      this.server.to(meetId).emit('user-video-update', { userId, status });
      this.server
        .to(meetId)
        .emit('FE-toggle-camera', { userId, switchTarget: 'video' });
      this.logger.log(
        `User ${userId} video updated to ${status} in meeting ${meetId}`,
      );
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
      return { success: false, error: error };
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
        this.server.to(`user:${userId}`).emit('removed-from-meet');
        this.server.to(meetId).emit('other-user-left-meet', { userId });
        this.server.to(meetId).emit('FE-user-leave', {
          userId,
          userName: this.videoCallService.getUser(userId)?.name || userId,
        });
        this.logger.log(`User ${userId} removed from meeting ${meetId}`);
        return { success: true };
      }
      throw new Error('Failed to remove user');
    } catch (error) {
      this.logger.error(`Error removing user from meeting: ${error}`);
      return { success: false, error: error };
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
        this.server.to(meetId).emit('FE-user-leave', {
          userId,
          userName: this.videoCallService.getUser(userId)?.name || userId,
        });
        this.logger.log(`User ${userId} left meeting ${meetId}`);
      }
      return { success: true };
    } catch (error) {
      this.logger.error(`Error leaving meeting: ${error}`);
      return { success: false, error: error };
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

      if (meeting.createdBy === userId || meeting.participants.has(userId)) {
        this.videoCallService.addParticipantToMeeting(meetId, userId);
        client.join(meetId);
        const participants =
          this.videoCallService.getMeetingParticipants(meetId);
        client.emit('meet-joined', {
          meetId,
          meetName: meeting.name,
          users: participants,
          isHost: meeting.createdBy === userId,
        });
        this.server
          .to(meetId)
          .except(`user:${userId}`)
          .emit('new-user-joined', { user });
        this.server
          .to(meetId)
          .except(`user:${userId}`)
          .emit('FE-user-join', {
            users: participants.map((u: any) => ({
              userId: u.id,
              info: { userName: u.name, video: true, audio: true },
            })),
          });
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
            .emit('join-request-timeout', {
              requestId,
              user,
              meetId,
              meetName: meeting.name,
            });
          client.emit('join-request-timeout', { meetId, requestId });
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
        .emit('join-request-received', {
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
      return { success: false, error: error };
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
          .emit('new-user-joined', { user });
        this.server
          .to(meetId)
          .except(`user:${userId}`)
          .emit('FE-user-join', {
            users: [
              {
                userId: user.id,
                info: { userName: user.name, video: true, audio: true },
              },
            ],
          });
      }

      this.server.to(`user:${userId}`).emit('join-meet-approved', {
        requestId,
        meetId,
        meetName: meeting.name,
      });

      this.logger.log(`Join request ${requestId} approved by host ${hostId}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Error approving join request: ${error}`);
      return { success: false, error: error };
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
      if (!meeting || meeting.createdBy !== hostId) {
        throw new Error('Only the host can reject join requests');
      }

      const request = this.videoCallService.getJoinRequest(requestId);
      if (!request) {
        throw new Error('Join request not found');
      }

      this.videoCallService.removeJoinRequest(requestId);
      this.server.to(`user:${userId}`).emit('join-request-rejected', {
        requestId,
        meetId,
      });

      this.logger.log(`Join request ${requestId} rejected by host ${hostId}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Error rejecting join request: ${error}`);
      return { success: false, error: error };
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
      if (!request || request.userId !== userId) {
        throw new Error('Only the user who created the request can cancel it');
      }

      this.videoCallService.removeJoinRequest(requestId);
      this.server.to(meetId).emit('join-request-canceled', {
        requestId,
        meetId,
        userId,
      });

      this.logger.log(`Join request ${requestId} canceled by user ${userId}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Error canceling join request: ${error}`);
      return { success: false, error: error };
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
          .emit('new-user-joined', { user });
        this.server
          .to(meetId)
          .except(`user:${userId}`)
          .emit('FE-user-join', {
            users: [
              {
                userId: user.id,
                info: { userName: user.name, video: true, audio: true },
              },
            ],
          });
      }

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
      return { success: false, error: error };
    }
  }

  @SubscribeMessage('BE-create-room')
  handleCreateRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId?: string; userName: string },
  ) {
    try {
      const { roomId, userName } = data;

      if (!userName) {
        throw new Error('Username is required');
      }

      // Generate room ID if not provided
      const meetId =
        roomId ||
        `room-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      // Create user with socket ID
      const userId = client.id;
      client.data.userId = userId;

      // Save user data
      const user: User = {
        id: userId,
        name: userName,
        email: `${userName.replace(/\s+/g, '').toLowerCase()}@example.com`,
        isHost: true,
      };
      this.videoCallService.saveUser(user);

      // Create meeting
      this.videoCallService.createMeeting(
        meetId,
        `Room by ${userName}`,
        userId,
      );

      // Add user to meeting
      this.videoCallService.addParticipantToMeeting(meetId, userId);

      // Join socket room
      client.join(meetId);

      this.logger.log(`Room created: ${meetId} by ${userName} (${userId})`);

      return {
        success: true,
        roomId: meetId,
        userId,
        info: {
          userName,
          video: true,
          audio: true,
        },
      };
    } catch (error) {
      this.logger.error(
        `Error creating room: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return {
        success: false,
        error: error instanceof Error ? error.toString() : 'Unknown error',
      };
    }
  }
}
