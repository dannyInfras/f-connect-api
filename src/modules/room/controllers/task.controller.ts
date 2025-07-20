import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { BaseApiResponse } from '@/shared/dtos/base-api-response.dto';
import { PaginationParamsDto } from '@/shared/dtos/pagination-params.dto';
import { ReqContext } from '@/shared/request-context/req-context.decorator';
import { RequestContext } from '@/shared/request-context/request-context.dto';

import { TaskAclService } from '../acl/task.acl';
import { CreateTaskDto } from '../dtos/create-task.dto';
import { ListTaskResDto } from '../dtos/res/list-task.res';
import { TaskResDto } from '../dtos/res/task.res';
import { UpdateTaskDto } from '../dtos/update-task.dto';
import { TaskNotificationGateway } from '../gateways/task-notification.gateway';
import { TaskService } from '../services/task.service';

@ApiTags('Tasks')
@Controller('tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class TaskController {
  constructor(
    private readonly taskService: TaskService,
    private readonly taskAclService: TaskAclService,
    private readonly notificationGateway: TaskNotificationGateway,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new task' })
  @ApiResponse({
    status: 201,
    description: 'Task created successfully',
    type: TaskResDto,
  })
  async create(
    @Body() createTaskDto: CreateTaskDto,
    @ReqContext() ctx: RequestContext,
  ): Promise<BaseApiResponse<TaskResDto>> {
    if (!ctx.user) {
      throw new UnauthorizedException('User must be logged in');
    }
    
    // Check if user can create this task
    await this.taskAclService.canCreate(ctx.user, {
      ...createTaskDto,
      userId: ctx.user.id
    } as any);
    
    const createdTask = await this.taskService.create(createTaskDto, ctx.user.id);
    
    // Notify via WebSocket
    this.notificationGateway.notifyTaskCreated(ctx.user.id, createdTask);
    
    return {
      data: createdTask,
      meta: {},
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all tasks' })
  @ApiResponse({ status: 200, type: ListTaskResDto })
  async findAll(
    @ReqContext() ctx: RequestContext,
    @Query() query: PaginationParamsDto,
  ): Promise<ListTaskResDto> {
    if (!ctx.user) {
      throw new UnauthorizedException('User must be logged in');
    }
    
    // Check if user can list tasks
    await this.taskAclService.canList(ctx.user);
    
    const page = Math.floor(query.offset / query.limit) + 1;
    return this.taskService.findAll(page, query.limit);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get all tasks for a user' })
  @ApiResponse({ status: 200, type: ListTaskResDto })
  async findByUser(
    @Param('userId') userId: string,
    @Query() query: PaginationParamsDto,
    @ReqContext() ctx: RequestContext,
  ): Promise<ListTaskResDto> {
    if (!ctx.user) {
      throw new UnauthorizedException('User must be logged in');
    }
    
    // Check if user can list tasks for the specified user
    await this.taskAclService.canList(ctx.user, Number(userId));
    
    return this.taskService.findByUserId(
      Number(userId),
      query.limit,
      query.offset,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a task by ID' })
  @ApiResponse({ status: 200, type: TaskResDto })
  async findOne(
    @Param('id') id: string,
    @ReqContext() ctx: RequestContext,
  ): Promise<BaseApiResponse<TaskResDto>> {
    if (!ctx.user) {
      throw new UnauthorizedException('User must be logged in');
    }
    
    const task = await this.taskService.findOne(id);
    
    // Check if user can view this task
    await this.taskAclService.canView(ctx.user, task);
    
    const taskDto = await this.taskService.getTaskDto(id);
    
    return {
      data: taskDto,
      meta: {},
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a task' })
  @ApiResponse({ status: 200, type: TaskResDto })
  async update(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @ReqContext() ctx: RequestContext,
  ): Promise<BaseApiResponse<TaskResDto>> {
    if (!ctx.user) {
      throw new UnauthorizedException('User must be logged in');
    }
    
    const task = await this.taskService.findOne(id);
    
    // Check if user can update this task
    await this.taskAclService.canUpdate(ctx.user, task);
    
    const updatedTask = await this.taskService.update(id, updateTaskDto);
    
    // Notify via WebSocket
    this.notificationGateway.notifyTaskUpdated(task.userId, updatedTask);
    
    return {
      data: updatedTask,
      meta: {},
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a task' })
  @ApiResponse({ status: 204 })
  async remove(
    @Param('id') id: string,
    @ReqContext() ctx: RequestContext,
  ): Promise<void> {
    if (!ctx.user) {
      throw new UnauthorizedException('User must be logged in');
    }
    
    const task = await this.taskService.findOne(id);
    
    // Check if user can delete this task
    await this.taskAclService.canDelete(ctx.user, task);
    
    const userId = task.userId;
    await this.taskService.remove(id);
    
    // Notify via WebSocket
    this.notificationGateway.notifyTaskDeleted(userId, id);
  }
} 