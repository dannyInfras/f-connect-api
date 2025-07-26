import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber,IsString } from 'class-validator';

export class CreateMessageDto {
  @ApiProperty({
    description: 'The ID of the conversation',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsString()
  conversationId: string;

  @ApiProperty({
    description: 'The ID of the sender',
    example: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  senderId: number;

  @ApiProperty({
    description: 'The content of the message',
    example: 'Hello, I would like to discuss the job opportunity.',
  })
  @IsNotEmpty()
  @IsString()
  content: string;
} 