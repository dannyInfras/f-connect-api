import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { VideoCallService } from '../services/video-call.service';
import { User } from '../interfaces/user.interface';

class MeetResponse {
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
  user: { id: string; name: string; email: string };
  meetId: string;
  requestTime: Date;
}

@ApiTags('video-call')
@Controller('video-call')
@ApiBearerAuth()
export class VideoCallController {
  constructor(private readonly videoCallService: VideoCallService) {}

  @Get('meets')
  @ApiOperation({ summary: 'Lấy danh sách các cuộc họp đang hoạt động' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách cuộc họp',
    type: [MeetResponse],
  })
  getAllMeets() {
    try {
      const meets = this.videoCallService.getAllMeets().map((meet) => ({
        meetId: meet.id,
        meetName: meet.name,
        createdAt: meet.createdAt,
        createdBy: meet.createdBy,
        participantCount: meet.participants.size,
      }));
      return { success: true, data: meets };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Không thể lấy danh sách cuộc họp',
      };
    }
  }

  @Get('meets/:id')
  @ApiOperation({ summary: 'Lấy thông tin cuộc họp theo ID' })
  @ApiResponse({
    status: 200,
    description: 'Chi tiết cuộc họp',
    type: MeetResponse,
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy cuộc họp' })
  getMeetById(@Param('id') id: string) {
    try {
      const meet = this.videoCallService.getMeet(id);
      if (!meet) {
        return { success: false, error: 'Không tìm thấy cuộc họp' };
      }
      const participants = Array.from(meet.participants)
        .map((userId) => this.videoCallService.getUser(userId))
        .filter((user): user is User => !!user)
        .map((user) => ({
          id: user.id,
          name: user.name,
          email: user.email,
        }));
      return {
        success: true,
        data: {
          meetId: meet.id,
          meetName: meet.name,
          createdAt: meet.createdAt,
          createdBy: meet.createdBy,
          participantCount: meet.participants.size,
          participants,
        },
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Không thể lấy thông tin cuộc họp',
      };
    }
  }

  @Get('meets/:id/join-requests')
  @ApiOperation({ summary: 'Lấy danh sách yêu cầu tham gia cuộc họp' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách yêu cầu tham gia',
    type: [JoinRequestResponse],
  })
  getJoinRequests(@Param('id') meetId: string) {
    try {
      const requests = this.videoCallService
        .getMeetJoinRequests(meetId)
        .map((request) => ({
          id: request.id,
          userId: request.userId,
          user: request.user,
          meetId: request.meetingId,
          requestTime: request.requestTime,
        }));
      return { success: true, data: requests };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Không thể lấy danh sách yêu cầu tham gia',
      };
    }
  }

  @Get('user/:userId/join-requests')
  @ApiOperation({
    summary: 'Lấy danh sách yêu cầu tham gia của một người dùng',
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách yêu cầu tham gia',
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
          meetId: request.meetingId,
          requestTime: request.requestTime,
        }));
      return { success: true, data: requests };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Không thể lấy danh sách yêu cầu tham gia',
      };
    }
  }

  @Get('host/:hostId/pending-requests')
  @ApiOperation({ summary: 'Lấy danh sách yêu cầu đang chờ xử lý của host' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách yêu cầu đang chờ',
    type: [JoinRequestResponse],
  })
  getHostPendingRequests(@Param('hostId') hostId: string) {
    try {
      const hostedMeets = this.videoCallService
        .getAllMeets()
        .filter((meet) => meet.createdBy === hostId);
      if (hostedMeets.length === 0) {
        return { success: true, data: [] };
      }
      const pendingRequests: JoinRequestResponse[] = [];
      for (const meet of hostedMeets) {
        const meetRequests = this.videoCallService
          .getMeetJoinRequests(meet.id)
          .map((request) => ({
            id: request.id,
            userId: request.userId,
            user: request.user,
            meetId: request.meetingId,
            requestTime: request.requestTime,
            meetName: meet.name,
          }));
        pendingRequests.push(...meetRequests);
      }
      return { success: true, data: pendingRequests };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Không thể lấy danh sách yêu cầu đang chờ',
      };
    }
  }
}
