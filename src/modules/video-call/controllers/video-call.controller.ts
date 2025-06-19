import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { User } from '../interfaces/user.interface';
import { VideoCallService } from '../services/video-call.service';

class MeetingResponse {
  meetId: string;
  meetName: string;
  createdAt: Date;
  createdBy: string;
  participantCount: number;
  participants?: { id: string; name: string; email: string }[];
  isHost?: boolean;
}

class JoinRequestResponse {
  id: string;
  userId: string;
  user: User;
  meetingId: string;
  requestTime: Date;
}

@ApiTags('video-call')
@Controller('video-call')
@ApiBearerAuth()
export class VideoCallController {
  constructor(private readonly videoCallService: VideoCallService) {}

  @Get('meetings')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all active meetings' })
  @ApiResponse({
    status: 200,
    description: 'List of active meetings',
    type: [MeetingResponse],
  })
  getAllMeetings() {
    try {
      const meetings = this.videoCallService
        .getAllMeetings()
        .map((meeting) => ({
          meetId: meeting.id,
          meetName: meeting.name,
          createdAt: meeting.createdAt,
          createdBy: meeting.createdBy,
          participantCount: meeting.participants.size,
        }));
      return {
        success: true,
        data: meetings,
      };
    } catch (error) {
      return {
        success: false,
        error: error || 'Failed to retrieve meetings',
      };
    }
  }

  @Get('meetings/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get meeting by ID' })
  @ApiResponse({
    status: 200,
    description: 'Meeting details',
    type: MeetingResponse,
  })
  @ApiResponse({
    status: 404,
    description: 'Meeting not found',
  })
  getMeetingById(@Param('id') id: string) {
    try {
      const meeting = this.videoCallService.getMeeting(id);
      if (!meeting) {
        return {
          success: false,
          error: 'Meeting not found',
        };
      }

      const participants = Array.from(meeting.participants.values())
        .map((userId) => this.videoCallService.getUser(userId))
        .filter((user) => !!user)
        .map((user) => ({
          id: user!.id,
          name: user!.name,
          email: user!.email,
        }));

      return {
        success: true,
        data: {
          meetId: meeting.id,
          meetName: meeting.name,
          createdAt: meeting.createdAt,
          createdBy: meeting.createdBy,
          participantCount: meeting.participants.size,
          participants,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error || 'Failed to retrieve meeting',
      };
    }
  }

  @Get('meetings/:id/join-requests')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all pending join requests for a meeting' })
  @ApiResponse({
    status: 200,
    description: 'List of pending join requests',
    type: [JoinRequestResponse],
  })
  getJoinRequests(@Param('id') meetingId: string) {
    try {
      const requests = this.videoCallService
        .getMeetingJoinRequests(meetingId)
        .map((request) => ({
          id: request.id,
          userId: request.userId,
          user: request.user,
          meetingId: request.meetingId,
          requestTime: request.requestTime,
        }));

      return {
        success: true,
        data: requests,
      };
    } catch (error) {
      return {
        success: false,
        error: error || 'Failed to retrieve join requests',
      };
    }
  }

  @Get('user/:userId/join-requests')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all pending join requests for a user' })
  @ApiResponse({
    status: 200,
    description: 'List of pending join requests',
    type: [JoinRequestResponse],
  })
  getUserJoinRequests(@Param('userId') userId: string) {
    try {
      const requests = this.videoCallService
        .getUserJoinRequests(userId)
        .map((request) => ({
          id: request.id,
          userId: request.userId,
          user: request.user,
          meetingId: request.meetingId,
          requestTime: request.requestTime,
        }));

      return {
        success: true,
        data: requests,
      };
    } catch (error) {
      return {
        success: false,
        error: error || 'Failed to retrieve user join requests',
      };
    }
  }

  @Get('host/:hostId/pending-requests')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get all pending requests for meetings where user is host',
  })
  @ApiResponse({
    status: 200,
    description: 'List of pending requests for host',
    type: [JoinRequestResponse],
  })
  getHostPendingRequests(@Param('hostId') hostId: string) {
    try {
      // Get all meetings where this user is the host
      const hostedMeetings = this.videoCallService
        .getAllMeetings()
        .filter((meeting) => meeting.createdBy === hostId);

      if (hostedMeetings.length === 0) {
        return { success: true, data: [] };
      }

      // Collect all pending requests from these meetings
      const pendingRequests: JoinRequestResponse[] = [];

      for (const meeting of hostedMeetings) {
        const meetingRequests = this.videoCallService
          .getMeetingJoinRequests(meeting.id)
          .map((request) => ({
            id: request.id,
            userId: request.userId,
            user: request.user,
            meetingId: request.meetingId,
            requestTime: request.requestTime,
            meetingName: meeting.name, // Add meeting name for context
          }));

        pendingRequests.push(...meetingRequests);
      }

      return {
        success: true,
        data: pendingRequests,
      };
    } catch (error) {
      return {
        success: false,
        error: error?.toString() || 'Failed to retrieve pending requests',
      };
    }
  }
}
