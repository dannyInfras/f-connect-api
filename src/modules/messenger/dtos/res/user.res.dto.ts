import { ApiProperty } from '@nestjs/swagger';

export class UserResDto {
  @ApiProperty({
    description: 'The unique identifier of the user',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'The email of the user',
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'The first name of the user',
    example: 'John',
  })
  firstName: string;

  @ApiProperty({
    description: 'The last name of the user',
    example: 'Doe',
  })
  lastName: string;

  @ApiProperty({
    description: 'The avatar URL of the user',
    example: 'https://example.com/avatar.jpg',
  })
  avatar?: string;

  @ApiProperty({
    description: 'The role of the user',
    example: 'candidate',
  })
  role: string;

  @ApiProperty({
    description: 'Whether the user is online',
    example: true,
  })
  isOnline?: boolean;
} 