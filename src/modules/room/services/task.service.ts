import { Injectable, NotFoundException } from '@nestjs/common';

import { CreateTaskDto } from '../dtos/create-task.dto';
import { ListTaskResDto } from '../dtos/res/list-task.res';
import { TaskResDto } from '../dtos/res/task.res';
import { UpdateTaskDto } from '../dtos/update-task.dto';
import { TaskEntity } from '../entities/task.entity';
import { TaskMapper } from '../mapper/task.mapper';
import { TaskRepository } from '../repositories/task.repository';

@Injectable()
export class TaskService {
  constructor(
    private readonly taskRepository: TaskRepository,
    private readonly taskMapper: TaskMapper,
  ) {}

  async create(
    createTaskDto: CreateTaskDto,
    userId: number,
  ): Promise<TaskResDto> {
    const taskData = this.taskMapper.toEntity(createTaskDto, userId);
    const task = await this.taskRepository.create(taskData);
    const taskDto = this.taskMapper.toDto(task);
    if (!taskDto) {
      throw new Error('Failed to map task entity to DTO');
    }
    return taskDto;
  }

  async findAll(page?: number, limit?: number): Promise<ListTaskResDto> {
    const skip = page ? (page - 1) * (limit || 10) : 0;
    const take = limit || 10;

    const tasks = await this.taskRepository.findAll();
    const startIndex = skip;
    const endIndex = skip + take;
    const paginatedTasks = tasks.slice(startIndex, endIndex);

    const taskDtos = paginatedTasks
      .map((task) => this.taskMapper.toDto(task))
      .filter((dto): dto is TaskResDto => dto !== null);

    return {
      items: taskDtos,
      meta: {
        total: tasks.length,
        page: page || 1,
        limit: take,
      },
    };
  }

  async findByUserId(
    userId: number,
    limit: number,
    offset: number,
  ): Promise<ListTaskResDto> {
    const tasks = await this.taskRepository.findByUserId(userId);

    if (!tasks.length) {
      throw new NotFoundException('No tasks found for this user');
    }

    const startIndex = offset;
    const endIndex = offset + limit;
    const paginatedTasks = tasks.slice(startIndex, endIndex);
    const page = Math.floor(offset / limit) + 1;

    const taskDtos = paginatedTasks
      .map((task) => this.taskMapper.toDto(task))
      .filter((dto): dto is TaskResDto => dto !== null);

    return {
      items: taskDtos,
      meta: {
        total: tasks.length,
        page,
        limit,
      },
    };
  }

  async findOne(id: string): Promise<TaskEntity> {
    const task = await this.taskRepository.findById(id);
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
    return task;
  }

  async getTaskDto(id: string): Promise<TaskResDto> {
    const task = await this.findOne(id);
    const taskDto = this.taskMapper.toDto(task);
    if (!taskDto) {
      throw new Error(`Failed to map task entity with ID ${id} to DTO`);
    }
    return taskDto;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto): Promise<TaskResDto> {
    // Convert DTO to entity
    const updateData = this.taskMapper.toUpdateEntity(updateTaskDto);

    // Update the task
    const updatedTask = await this.taskRepository.update(id, updateData);
    if (!updatedTask) {
      throw new NotFoundException(`Task with ID ${id} not found after update`);
    }

    // Map entity to DTO
    const taskDto = this.taskMapper.toDto(updatedTask);
    if (!taskDto) {
      throw new Error('Failed to map updated task entity to DTO');
    }
    return taskDto;
  }

  async remove(id: string): Promise<void> {
    const task = await this.findOne(id);
    if (task) {
      await this.taskRepository.delete(id);
    }
  }
}
