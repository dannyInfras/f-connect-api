import { ApiProperty } from '@nestjs/swagger';

import { UserResDto } from './user.res.dto';

export class MessageResDto {
  @ApiProperty({
    description: 'The unique identifier of the message',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'The ID of the conversation',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  conversationId: string;

  @ApiProperty({
    description: 'The sender of the message',
    type: UserResDto,
  })
  sender: UserResDto;

  @ApiProperty({
    description: 'The content of the message',
    example: 'Hello, I would like to discuss the job opportunity.',
  })
  content: string;

  @ApiProperty({
    description: 'Whether the message has been read',
    example: false,
  })
  isRead: boolean;

  @ApiProperty({
    description: 'The timestamp when the message was created',
    example: '2023-01-01T12:00:00Z',
  })
  createdAt: Date;
} 