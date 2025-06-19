import { User } from './user.interface';

export interface Meeting {
  id: string;
  name: string;
  createdAt: Date;
  createdBy: string;
  participants: Set<string>;
  pendingJoinRequests?: Map<string, JoinRequest>;
}

export interface JoinRequest {
  id: string;
  userId: string;
  user: User;
  meetingId: string;
  requestTime: Date;
  timeoutRef?: NodeJS.Timeout;
} 
