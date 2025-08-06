import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { plainToClass } from 'class-transformer';

import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { User } from '@/modules/user/entities/user.entity';
import { GetUser } from '@/shared/decorators/get-user.decorator';

import { CreateScheduleEventDto } from '../dtos/create-schedule-event.dto';
import { ScheduleEventResponseDto } from '../dtos/schedule-event-response.dto';
import { UpdateScheduleEventDto } from '../dtos/update-schedule-event.dto';
import { EventStatus } from '../enums/event-status.enum';
import { EventType } from '../enums/event-type.enum';
import { ScheduleService } from '../services/schedule.service';
import {
  CreateEventData,
  EventFilter,
  TimeRange,
} from '../types/schedule.types';

@ApiTags('Schedule Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Post('companies/:companyId/events')
  @ApiOperation({ summary: 'Create a new schedule event' })
  @ApiParam({ name: 'companyId', description: 'Company ID' })
  @ApiResponse({
    status: 201,
    description: 'Event created successfully',
    type: ScheduleEventResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 409, description: 'Time conflict detected' })
  async createEvent(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Body() createEventDto: CreateScheduleEventDto,
    @GetUser() user: User,
  ): Promise<ScheduleEventResponseDto> {
    const createEventData: CreateEventData = {
      companyId: companyId.toString(),
      title: createEventDto.title,
      type: createEventDto.type,
      startsAt: new Date(createEventDto.startsAt),
      endsAt: new Date(createEventDto.endsAt),
      location: createEventDto.location,
      notes: createEventDto.notes,
      participants: createEventDto.participants.map((participant) => ({
        userId: participant.userId,
        role: participant.role,
      })),
      createdBy: user.id,
    };

    return this.scheduleService.createEvent(createEventData, user);
  }

  @Get('companies/:companyId/events')
  @ApiOperation({ summary: 'Get events for a company' })
  @ApiParam({ name: 'companyId', description: 'Company ID' })
  @ApiQuery({ name: 'type', required: false, enum: EventType })
  @ApiQuery({ name: 'status', required: false, enum: EventStatus })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Filter events from this date (ISO 8601)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'Filter events until this date (ISO 8601)',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10)',
  })
  @ApiResponse({
    status: 200,
    description: 'Events retrieved successfully',
    type: [ScheduleEventResponseDto],
  })
  async getCompanyEvents(
    @Param('companyId', ParseIntPipe) companyId: number,
    @GetUser() user: User,
    @Query('type') type?: EventType,
    @Query('status') status?: EventStatus,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const filter: EventFilter = {
      companyId: companyId.toString(),
      type,
      status,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page: page || 1,
      limit: limit || 10,
    };

    return this.scheduleService.fetchEvents(filter, user);
  }

  @Get('users/me/events')
  @ApiOperation({ summary: "Get current user's events" })
  @ApiQuery({ name: 'type', required: false, enum: EventType })
  @ApiQuery({ name: 'status', required: false, enum: EventStatus })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Filter events from this date (ISO 8601)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'Filter events until this date (ISO 8601)',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10)',
  })
  @ApiResponse({
    status: 200,
    description: 'User events retrieved successfully',
    type: [ScheduleEventResponseDto],
  })
  async getUserEvents(
    @GetUser() user: User,
    @Query('type') type?: EventType,
    @Query('status') status?: EventStatus,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const filter: EventFilter = {
      userId: user.id,
      type,
      status,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page: page || 1,
      limit: limit || 10,
    };

    return this.scheduleService.fetchEvents(filter, user);
  }

  @Get('events/:eventId')
  @ApiOperation({ summary: 'Get event by ID' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiResponse({
    status: 200,
    description: 'Event retrieved successfully',
    type: ScheduleEventResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async getEventById(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @GetUser() user: User,
  ): Promise<ScheduleEventResponseDto> {
    return this.scheduleService.getEventById(eventId, user);
  }

  @Patch('events/:eventId')
  @ApiOperation({ summary: 'Update an event' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiResponse({
    status: 200,
    description: 'Event updated successfully',
    type: ScheduleEventResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({
    status: 409,
    description: 'Version mismatch or time conflict',
  })
  async updateEvent(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Body() updateEventDto: UpdateScheduleEventDto,
    @GetUser() user: User,
  ): Promise<ScheduleEventResponseDto> {
    const updateData = {
      ...updateEventDto,
      startsAt: updateEventDto.startsAt
        ? new Date(updateEventDto.startsAt)
        : undefined,
      endsAt: updateEventDto.endsAt
        ? new Date(updateEventDto.endsAt)
        : undefined,
      version: updateEventDto.version || 1,
    };

    return this.scheduleService.updateEvent(eventId, updateData, user);
  }

  @Delete('events/:eventId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cancel/Delete an event' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiResponse({ status: 204, description: 'Event cancelled successfully' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async cancelEvent(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @GetUser() user: User,
  ): Promise<void> {
    return this.scheduleService.cancelEvent(eventId, user);
  }

  @Post('events/:eventId/confirm')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Confirm attendance for an event' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiResponse({
    status: 204,
    description: 'Attendance confirmed successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Event not found or user not a participant',
  })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async confirmAttendance(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @GetUser() user: User,
  ): Promise<void> {
    return this.scheduleService.confirmAttendance(eventId, user);
  }

  @Post('events/:eventId/decline')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Decline attendance for an event' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiResponse({ status: 204, description: 'Attendance declined successfully' })
  @ApiResponse({
    status: 404,
    description: 'Event not found or user not a participant',
  })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async declineAttendance(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @GetUser() user: User,
  ): Promise<void> {
    return this.scheduleService.declineAttendance(eventId, user);
  }

  @Post('events/:eventId/reschedule')
  @ApiOperation({ summary: 'Reschedule an event' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiResponse({
    status: 200,
    description: 'Event rescheduled successfully',
    type: ScheduleEventResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid time range' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 409, description: 'Time conflict detected' })
  async rescheduleEvent(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Body() body: { startsAt: string; endsAt: string },
    @GetUser() user: User,
  ): Promise<ScheduleEventResponseDto> {
    const timeRange: TimeRange = {
      startsAt: new Date(body.startsAt),
      endsAt: new Date(body.endsAt),
    };

    return this.scheduleService.rescheduleEvent(eventId, timeRange, user);
  }

  @Get('users/:userId/upcoming')
  @ApiOperation({ summary: "Get user's upcoming events (next 30 days)" })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'Upcoming events retrieved successfully',
    type: [ScheduleEventResponseDto],
  })
  async getUserUpcomingEvents(
    @Param('userId', ParseIntPipe) userId: number,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @GetUser() user: User,
  ) {
    // Note: This endpoint should also check permissions
    const events = await this.scheduleService.getUserUpcomingEvents(userId);

    return events.map((event) =>
      plainToClass(ScheduleEventResponseDto, event, {
        excludeExtraneousValues: true,
      }),
    );
  }

  @Post('users/:userId/conflicts')
  @ApiOperation({ summary: 'Check for time conflicts for a user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'Conflict check completed',
    schema: {
      type: 'object',
      properties: {
        hasConflicts: { type: 'boolean' },
      },
    },
  })
  async checkUserConflicts(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() body: { startsAt: string; endsAt: string },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @GetUser() user: User,
  ) {
    const timeRange: TimeRange = {
      startsAt: new Date(body.startsAt),
      endsAt: new Date(body.endsAt),
    };

    const hasConflicts = await this.scheduleService.checkUserConflicts(
      userId,
      timeRange,
    );

    return { hasConflicts };
  }
}
