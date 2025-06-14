import { User } from './user.interface';

export interface Meeting {
  id: string;
  name: string;
  participants: Map<string, User>;
  createdAt: Date;
  createdBy: string;
} 
