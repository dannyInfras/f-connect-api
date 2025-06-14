import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { VideoCallService } from '../services/video-call.service';

@ApiTags('video-call')
@Controller('video-call')
@ApiBearerAuth()
export class VideoCallController {
  constructor(private readonly videoCallService: VideoCallService) {}

  @Get('meetings')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all active meetings' })
  getAllMeetings() {
    return {
      success: true,
      data: this.videoCallService.getAllMeetings().map(meeting => ({
        id: meeting.id,
        name: meeting.name,
        createdAt: meeting.createdAt,
        createdBy: meeting.createdBy,
        participantCount: meeting.participants.size
      }))
    };
  }

  @Get('meetings/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get meeting by ID' })
  getMeetingById(@Param('id') id: string) {
    const meeting = this.videoCallService.getMeeting(id);
    
    if (!meeting) {
      return {
        success: false,
        error: 'Meeting not found'
      };
    }
    
    return {
      success: true,
      data: {
        id: meeting.id,
        name: meeting.name,
        createdAt: meeting.createdAt,
        createdBy: meeting.createdBy,
        participants: Array.from(meeting.participants.values())
      }
    };
  }
} 
