import { Injectable } from '@nestjs/common';

import { Meeting } from '../interfaces/meeting.interface';
import { User } from '../interfaces/user.interface';

@Injectable()
export class VideoCallService {
  private users: Map<string, User> = new Map();
  private meetings: Map<string, Meeting> = new Map();
  
  // User management methods
  saveUser(user: User): void {
    this.users.set(user.id, user);
  }

  getUser(userId: string): User | undefined {
    return this.users.get(userId);
  }

  removeUser(userId: string): boolean {
    return this.users.delete(userId);
  }

  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }

  // Meeting management methods
  createMeeting(id: string, name: string, creatorId: string): Meeting {
    const creator = this.users.get(creatorId);
    if (!creator) {
      throw new Error('Creator user not found');
    }

    const meeting: Meeting = {
      id,
      name,
      participants: new Map([[creatorId, creator]]),
      createdAt: new Date(),
      createdBy: creatorId,
    };

    this.meetings.set(id, meeting);
    return meeting;
  }

  getMeeting(meetingId: string): Meeting | undefined {
    return this.meetings.get(meetingId);
  }

  addParticipantToMeeting(meetingId: string, userId: string): Meeting {
    const meeting = this.meetings.get(meetingId);
    if (!meeting) {
      throw new Error('Meeting not found');
    }

    const user = this.users.get(userId);
    if (!user) {
      throw new Error('User not found');
    }

    meeting.participants.set(userId, user);
    return meeting;
  }

  removeParticipantFromMeeting(meetingId: string, userId: string): Meeting | undefined {
    const meeting = this.meetings.get(meetingId);
    if (!meeting) {
      return undefined;
    }

    meeting.participants.delete(userId);
    
    // If no participants left, remove the meeting
    if (meeting.participants.size === 0) {
      this.meetings.delete(meetingId);
      return undefined;
    }

    return meeting;
  }

  renameMeeting(meetingId: string, newName: string): Meeting {
    const meeting = this.meetings.get(meetingId);
    if (!meeting) {
      throw new Error('Meeting not found');
    }

    meeting.name = newName;
    return meeting;
  }

  isUserInMeeting(userId: string): boolean {
    for (const meeting of this.meetings.values()) {
      if (meeting.participants.has(userId)) {
        return true;
      }
    }
    return false;
  }

  getUserMeeting(userId: string): Meeting | undefined {
    for (const meeting of this.meetings.values()) {
      if (meeting.participants.has(userId)) {
        return meeting;
      }
    }
    return undefined;
  }

  getAllMeetings(): Meeting[] {
    return Array.from(this.meetings.values());
  }
} 
