export interface User {
  id: string;
  name: string;
  email: string;
  isHost?: boolean;
  video?: boolean; // Added for Express compatibility
  audio?: boolean; // Added for Express compatibility
}

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
