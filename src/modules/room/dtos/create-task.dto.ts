import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class ChecklistItemDto {
  @ApiProperty({ example: '1752838851649' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ example: 'Complete task documentation' })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiProperty({ example: false })
  @IsOptional()
  completed?: boolean;
}

export class RecurringDto {
  @ApiProperty({ example: 'daily', enum: ['daily', 'weekly', 'monthly', null] })
  @IsOptional()
  @IsEnum(['daily', 'weekly', 'monthly', null])
  frequency?: 'daily' | 'weekly' | 'monthly' | null;

  @ApiProperty({ example: 2 })
  @IsInt()
  @IsOptional()
  interval?: number;
}

export class CreateTaskDto {
  @ApiProperty({ example: 'Complete project documentation' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ example: 'Finish all sections of the project documentation' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'TODO', enum: ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'] })
  @IsOptional()
  @IsEnum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'])
  status?: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';

  @ApiProperty({ example: '2025-07-18T18:40' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dueDate?: Date;

  @ApiProperty({ example: '2025-07-18T10:40:00.000Z' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  reminderTime?: Date;

  @ApiProperty({ example: ['documentation', 'urgent'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
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
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChecklistItemDto)
  checklist?: ChecklistItemDto[];

  @ApiProperty({
    example: {
      frequency: 'daily',
      interval: 2,
    },
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => RecurringDto)
  recurring?: RecurringDto;

  @ApiProperty({ example: 20 })
  @IsOptional()
  @IsInt()
  estimatedTime?: number;

  @ApiProperty({ example: 'medium', enum: ['low', 'medium', 'high'] })
  @IsOptional()
  @IsEnum(['low', 'medium', 'high'])
  priority?: 'low' | 'medium' | 'high';

  @ApiProperty({ example: 0 })
  @IsOptional()
  @IsInt()
  progress?: number;
} 