import { User } from './user.interface';

export interface SignalEventData {
  to: string;
  from: string;
  signal: any;
  meetId: string;
}

export interface CreateMeetEventData {
  meetId: string;
  meetName: string;
}

export interface JoinMeetEventData {
  meetId: string;
  user: User;
}

export interface MeetRenameEventData {
  meetId: string;
  newMeetName: string;
}

export interface MediaToggleEventData {
  userId: string;
  meetId: string;
  status: boolean;
}

export interface ScreenSharingEventData {
  userId: string;
  meetId: string;
  status: boolean;
}

export interface ChatMessageEventData {
  meetId: string;
  from: User;
  message: string;
  timestamp: string;
}

export interface RemoveFromMeetEventData {
  userId: string;
  meetId: string;
}

export interface LeftMeetEventData {
  userId: string;
  meetId: string;
}

export interface RejectCallEventData {
  to: string;
  from: User;
}

export interface CancelMeetRequestEventData {
  meetId: string;
}

export interface RequestJoinMeetEventData {
  meetId: string;
  user: User;
}

export interface ApproveJoinRequestEventData {
  requestId: string;
  meetId: string;
  userId: string;
}

export interface RejectJoinRequestEventData {
  requestId: string;
  meetId: string;
  userId: string;
}

export interface CancelJoinRequestEventData {
  requestId: string;
  meetId: string;
}
