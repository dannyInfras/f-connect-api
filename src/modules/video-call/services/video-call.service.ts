import { Injectable, Logger } from '@nestjs/common';

import { JoinRequest,Meeting } from '../interfaces/meeting.interface';
import { User } from '../interfaces/user.interface';

@Injectable()
export class VideoCallService {
  private users = new Map<string, User>();
  private meetings = new Map<string, Meeting>();
  private joinRequests = new Map<string, JoinRequest>();
  private readonly JOIN_REQUEST_TIMEOUT = 60000; // 1 minute timeout for join requests
  private readonly logger = new Logger(VideoCallService.name);

  saveUser(user: User) {
    if (!user.id || !user.name || !user.email) {
      throw new Error('Invalid user data');
    }
    this.users.set(user.id, user);
    this.logger.debug(`User saved: ${user.id} (${user.name})`);
  }

  getUser(userId: string): User | undefined {
    return this.users.get(userId);
  }

  removeUser(userId: string) {
    this.users.delete(userId);
    this.logger.debug(`User removed: ${userId}`);
  }

  createMeeting(meetId: string, meetName: string, creatorId: string) {
    if (!meetId || !meetName || !creatorId) {
      throw new Error('Invalid meeting data');
    }
    if (!this.users.has(creatorId)) {
      throw new Error('Creator not found');
    }
    this.meetings.set(meetId, {
      id: meetId,
      name: meetName,
      createdAt: new Date(),
      createdBy: creatorId,
      participants: new Set([creatorId]),
      pendingJoinRequests: new Map(),
    });
    this.logger.debug(`Meeting created: ${meetId} (${meetName}) by ${creatorId}`);
  }

  getMeeting(meetId: string): Meeting | undefined {
    return this.meetings.get(meetId);
  }

  removeMeeting(meetId: string) {
    const meeting = this.meetings.get(meetId);
    if (meeting && meeting.pendingJoinRequests) {
      // Clear all timeouts for pending requests
      for (const request of meeting.pendingJoinRequests.values()) {
        if (request.timeoutRef) {
          clearTimeout(request.timeoutRef);
        }
        this.joinRequests.delete(request.id);
      }
    }
    this.meetings.delete(meetId);
    this.logger.debug(`Meeting removed: ${meetId}`);
  }

  addParticipantToMeeting(meetId: string, userId: string): Meeting | null {
    const meeting = this.meetings.get(meetId);
    if (!meeting) {
      return null;
    }
    if (!this.users.has(userId)) {
      throw new Error('User not found');
    }
    meeting.participants.add(userId);
    this.logger.debug(`Participant added: ${userId} to meeting ${meetId}`);
    return meeting;
  }

  removeParticipantFromMeeting(meetId: string, userId: string): Meeting | null {
    const meeting = this.meetings.get(meetId);
    if (!meeting) {
      return null;
    }
    meeting.participants.delete(userId);
    this.logger.debug(`Participant removed: ${userId} from meeting ${meetId}`);
    if (meeting.participants.size === 0) {
      this.meetings.delete(meetId);
      this.logger.debug(`Meeting auto-removed as no participants left: ${meetId}`);
      return null;
    }
    return meeting;
  }

  renameMeeting(meetId: string, newMeetName: string): Meeting | null {
    const meeting = this.meetings.get(meetId);
    if (!meeting) {
      return null;
    }
    meeting.name = newMeetName;
    this.logger.debug(`Meeting renamed: ${meetId} to "${newMeetName}"`);
    return meeting;
  }

  getUserMeeting(userId: string): Meeting | null {
    for (const meeting of this.meetings.values()) {
      if (meeting.participants.has(userId)) {
        return meeting;
      }
    }
    return null;
  }

  isUserInMeeting(userId: string): boolean {
    return !!this.getUserMeeting(userId);
  }

  getAllMeetings(): Meeting[] {
    return Array.from(this.meetings.values());
  }

  getMeetingParticipants(meetId: string): User[] {
    const meeting = this.meetings.get(meetId);
    if (!meeting) {
      return [];
    }
    
    return Array.from(meeting.participants.values())
      .map(id => this.users.get(id))
      .filter((user): user is User => !!user);
  }

  isUserMeetingHost(userId: string, meetId: string): boolean {
    const meeting = this.getMeeting(meetId);
    return !!meeting && meeting.createdBy === userId;
  }

  createJoinRequest(requestId: string, meetingId: string, userId: string, user: User, timeoutCallback: (request: JoinRequest) => void): JoinRequest | null {
    const meeting = this.meetings.get(meetingId);
    if (!meeting) {
      return null;
    }

    if (!meeting.pendingJoinRequests) {
      meeting.pendingJoinRequests = new Map();
    }

    // Create join request
    const joinRequest: JoinRequest = {
      id: requestId,
      userId,
      user,
      meetingId,
      requestTime: new Date(),
    };

    // Set timeout to automatically reject the request after a certain time
    const timeoutRef = setTimeout(() => {
      this.removeJoinRequest(requestId);
      timeoutCallback(joinRequest);
    }, this.JOIN_REQUEST_TIMEOUT);

    joinRequest.timeoutRef = timeoutRef;

    // Store the request in both maps
    this.joinRequests.set(requestId, joinRequest);
    meeting.pendingJoinRequests.set(requestId, joinRequest);
    
    this.logger.debug(`Join request created: ${requestId} from ${userId} for meeting ${meetingId}`);
    return joinRequest;
  }

  getJoinRequest(requestId: string): JoinRequest | undefined {
    return this.joinRequests.get(requestId);
  }

  removeJoinRequest(requestId: string): boolean {
    const request = this.joinRequests.get(requestId);
    if (!request) {
      return false;
    }

    // Clear timeout if it exists
    if (request.timeoutRef) {
      clearTimeout(request.timeoutRef);
    }

    // Remove from meeting's pending requests
    const meeting = this.meetings.get(request.meetingId);
    if (meeting && meeting.pendingJoinRequests) {
      meeting.pendingJoinRequests.delete(requestId);
    }

    // Remove from main requests map
    this.joinRequests.delete(requestId);
    this.logger.debug(`Join request removed: ${requestId}`);
    return true;
  }

  getMeetingJoinRequests(meetingId: string): JoinRequest[] {
    const meeting = this.meetings.get(meetingId);
    if (!meeting || !meeting.pendingJoinRequests) {
      return [];
    }

    return Array.from(meeting.pendingJoinRequests.values());
  }

  getUserJoinRequests(userId: string): JoinRequest[] {
    return Array.from(this.joinRequests.values())
      .filter(request => request.userId === userId);
  }

  hasPendingJoinRequest(userId: string, meetingId: string): boolean {
    const meeting = this.meetings.get(meetingId);
    if (!meeting || !meeting.pendingJoinRequests) {
      return false;
    }

    for (const request of meeting.pendingJoinRequests.values()) {
      if (request.userId === userId) {
        return true;
      }
    }

    return false;
  }

  setJoinRequestTimeout(requestId: string, timeoutMs: number, timeoutCallback: (request: JoinRequest) => void): boolean {
    const request = this.joinRequests.get(requestId);
    if (!request) {
      return false;
    }

    // Clear existing timeout if any
    if (request.timeoutRef) {
      clearTimeout(request.timeoutRef);
    }

    // Set a new timeout
    request.timeoutRef = setTimeout(() => {
      this.removeJoinRequest(requestId);
      timeoutCallback(request);
    }, timeoutMs);

    return true;
  }
}
