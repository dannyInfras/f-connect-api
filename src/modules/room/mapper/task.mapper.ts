import { Injectable } from '@nestjs/common';

import { ChecklistItemDto, CreateTaskDto, RecurringDto } from '../dtos/create-task.dto';
import { TaskResDto } from '../dtos/res/task.res';
import { UpdateTaskDto } from '../dtos/update-task.dto';
import { ChecklistItem, RecurringSettings,TaskEntity } from '../entities/task.entity';

@Injectable()
export class TaskMapper {
  toEntity(dto: CreateTaskDto, userId: number): Partial<TaskEntity> {
    return {
      title: dto.title,
      description: dto.description,
      status: dto.status || 'TODO',
      dueDate: dto.dueDate,
      reminderTime: dto.reminderTime,
      tags: this.ensureTagsArray(dto.tags),
      checklist: this.mapChecklistDtoToEntity(dto.checklist),
      recurring: this.mapRecurringDtoToEntity(dto.recurring),
      estimatedTime: dto.estimatedTime,
      priority: dto.priority || 'medium',
      progress: dto.progress,
      userId: userId,
    };
  }

  toUpdateEntity(dto: UpdateTaskDto): Partial<TaskEntity> {
    return {
      title: dto.title,
      description: dto.description,
      status: dto.status,
      dueDate: dto.dueDate,
      reminderTime: dto.reminderTime,
      tags: this.ensureTagsArray(dto.tags),
      checklist: this.mapChecklistDtoToEntity(dto.checklist),
      recurring: this.mapRecurringDtoToEntity(dto.recurring),
      estimatedTime: dto.estimatedTime,
      priority: dto.priority,
      progress: dto.progress,
    };
  }

  toDto(entity: TaskEntity | null): TaskResDto | null {
    if (!entity) return null;
    
    return {
      id: entity.id,
      title: entity.title,
      description: entity.description,
      status: entity.status,
      dueDate: entity.dueDate ? entity.dueDate.toISOString() : undefined,
      reminderTime: entity.reminderTime ? entity.reminderTime.toISOString() : undefined,
      tags: entity.tags || [],
      checklist: entity.checklist || [],
      recurring: entity.recurring || { frequency: null, interval: 1 },
      estimatedTime: entity.estimatedTime,
      priority: entity.priority || 'medium',
      progress: entity.progress || 0,
      userId: entity.userId,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }

  /**
   * Ensures tags are properly formatted as an array
   * Handles various input formats that might come from the frontend
   */
  private ensureTagsArray(tags?: string[] | string | null): string[] | undefined {
    if (!tags) return undefined;
    
    // If it's already an array, filter out any empty strings and return
    if (Array.isArray(tags)) {
      return tags.filter(tag => tag && tag.trim() !== '');
    }
    
    // If it's a string, split by comma and trim each tag
    if (typeof tags === 'string') {
      return tags.split(',')
        .map(tag => tag.trim())
        .filter(tag => tag !== '');
    }
    
    return undefined;
  }

  private mapChecklistDtoToEntity(checklist?: ChecklistItemDto[]): ChecklistItem[] | undefined {
    if (!checklist) return undefined;
    return checklist.map(item => ({
      id: item.id,
      text: item.text,
      completed: item.completed || false
    }));
  }

  private mapRecurringDtoToEntity(recurring?: RecurringDto): RecurringSettings | undefined {
    if (!recurring) return undefined;
    return {
      frequency: recurring.frequency || null,
      interval: recurring.interval || 1
    };
  }
} 