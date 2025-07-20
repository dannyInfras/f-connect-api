import { ApiProperty } from '@nestjs/swagger';

import { ChecklistItemDto, RecurringDto } from '../create-task.dto';

export class TaskResDto {
  @ApiProperty({ example: '1752838688484' })
  id: string;

  @ApiProperty({ example: 'Complete project documentation' })
  title: string;

  @ApiProperty({ example: 'Finish all sections of the project documentation' })
  description?: string;

  @ApiProperty({ example: 'TODO' })
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';

  @ApiProperty({ example: '2025-07-18T18:40:00.000Z' })
  dueDate?: string;

  @ApiProperty({ example: '2025-07-18T10:40:00.000Z' })
  reminderTime?: string;

  @ApiProperty({ example: ['documentation', 'urgent'] })
  tags?: string[];

  @ApiProperty({
    example: [
      {
        id: '1752838851649',
        text: 'Complete introduction',
        completed: false,
      },
    ],
  })
  checklist?: ChecklistItemDto[];

  @ApiProperty({
    example: {
      frequency: 'daily',
      interval: 2,
    },
  })
  recurring?: RecurringDto;

  @ApiProperty({ example: 20 })
  estimatedTime?: number;

  @ApiProperty({ example: 'medium' })
  priority: 'low' | 'medium' | 'high';

  @ApiProperty({ example: 0 })
  progress?: number;

  @ApiProperty({ example: 1 })
  userId: number;

  @ApiProperty({ example: '2025-07-18T11:38:08.484Z' })
  createdAt: string;

  @ApiProperty({ example: '2025-07-18T11:41:01.756Z' })
  updatedAt: string;
} 