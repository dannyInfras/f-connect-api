import { User } from './user.interface';

export interface CallUserEventData {
  to: string;
  from: User;
  signal: any;
}

export interface AcceptCallEventData {
  to: string;
  from: User;
  signal: any;
  meetName: string;
}

export interface RejectCallEventData {
  to: string;
  from: User;
}

export interface CancelCallEventData {
  to: string;
  from: User;
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

export interface MeetRenameEventData {
  meetId: string;
  name: string;
}

export interface ChatMessageEventData {
  meetId: string;
  from: User;
  message: string;
  timestamp: Date;
}

export interface DisconnectEventData {
  userId: string;
  meetId?: string;
} 

export interface JoinRequestEventData {
  meetId: string;
  user: User;
  requestId: string;
}

export interface ApproveJoinRequestEventData {
  requestId: string;
  meetId: string;
  userId: string;
  hostId: string;
}

export interface RejectJoinRequestEventData {
  requestId: string;
  meetId: string;
  userId: string;
  hostId: string;
}

export interface CancelJoinRequestEventData {
  requestId: string;
  meetId: string;
  userId: string;
} 
