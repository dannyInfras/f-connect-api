import { ApiProperty } from '@nestjs/swagger';

import { MessageResDto } from './message.res.dto';
import { UserResDto } from './user.res.dto';

export class ConversationResDto {
  @ApiProperty({
    description: 'The unique identifier of the conversation',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'The candidate user in the conversation',
    type: UserResDto,
  })
  candidate: UserResDto;

  @ApiProperty({
    description: 'The company user in the conversation',
    type: UserResDto,
  })
  company: UserResDto;

  @ApiProperty({
    description: 'The last message in the conversation',
    example: 'Hello, I would like to discuss the job opportunity.',
  })
  lastMessage: string;

  @ApiProperty({
    description: 'Whether the last message has been read',
    example: false,
  })
  isRead: boolean;

  @ApiProperty({
    description: 'The messages in the conversation',
    type: [MessageResDto],
  })
  messages: MessageResDto[];

  @ApiProperty({
    description: 'The timestamp when the conversation was created',
    example: '2023-01-01T12:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'The timestamp when the conversation was last updated',
    example: '2023-01-01T12:30:00Z',
  })
  updatedAt: Date;
} 