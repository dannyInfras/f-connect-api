import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ScheduleEvent } from '../entities/schedule-event.entity';
import { ScheduleParticipant } from '../entities/schedule-participant.entity';
import { EventStatus } from '../enums/event-status.enum';
import {
  CreateEventData,
  EventFilter,
  IScheduleRepository,
  PaginatedResult,
  TimeRange,
  UpdateEventData,
} from '../types/schedule.types';

@Injectable()
export class ScheduleEventRepository implements IScheduleRepository {
  constructor(
    @InjectRepository(ScheduleEvent)
    private readonly eventRepository: Repository<ScheduleEvent>,
    @InjectRepository(ScheduleParticipant)
    private readonly participantRepository: Repository<ScheduleParticipant>,
  ) {}

  async create(data: CreateEventData): Promise<ScheduleEvent> {
    const event = this.eventRepository.create({
      companyId: data.companyId,
      createdBy: data.createdBy,
      title: data.title,
      type: data.type,
      startsAt: data.startsAt,
      endsAt: data.endsAt,
      location: data.location,
      notes: data.notes,
    });

    const savedEvent = await this.eventRepository.save(event);

    // Create participants
    const participants = data.participants.map((participant) =>
      this.participantRepository.create({
        eventId: savedEvent.id,
        userId: participant.userId,
        role: participant.role,
      }),
    );

    await this.participantRepository.save(participants);

    const result = await this.findById(savedEvent.id);
    if (!result) {
      throw new Error('Failed to create event');
    }
    return result;
  }

  async update(id: string, data: UpdateEventData): Promise<ScheduleEvent> {
    const updateResult = await this.eventRepository.update(
      { id, version: data.version },
      {
        ...(data.title && { title: data.title }),
        ...(data.type && { type: data.type }),
        ...(data.status && { status: data.status }),
        ...(data.startsAt && { startsAt: data.startsAt }),
        ...(data.endsAt && { endsAt: data.endsAt }),
        ...(data.location !== undefined && { location: data.location }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
    );

    if (updateResult.affected === 0) {
      throw new Error('Event not found or version mismatch');
    }

    const result = await this.findById(id);
    if (!result) {
      throw new Error('Event not found after update');
    }
    return result;
  }

  async findById(id: string): Promise<ScheduleEvent | null> {
    return this.eventRepository.findOne({
      where: { id, deletedAt: undefined as any },
      relations: ['participants', 'participants.user', 'company', 'creator'],
    });
  }

  async findByFilter(
    filter: EventFilter,
  ): Promise<PaginatedResult<ScheduleEvent>> {
    const queryBuilder = this.eventRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.participants', 'participants')
      .leftJoinAndSelect('participants.user', 'user')
      .leftJoinAndSelect('event.company', 'company')
      .leftJoinAndSelect('event.creator', 'creator')
      .where('event.deletedAt IS NULL');

    // Apply filters
    if (filter.companyId) {
      queryBuilder.andWhere('event.companyId = :companyId', {
        companyId: filter.companyId,
      });
    }

    if (filter.userId) {
      queryBuilder.andWhere('participants.userId = :userId', {
        userId: filter.userId,
      });
    }

    if (filter.type) {
      queryBuilder.andWhere('event.type = :type', { type: filter.type });
    }

    if (filter.status) {
      queryBuilder.andWhere('event.status = :status', {
        status: filter.status,
      });
    }

    if (filter.startDate) {
      queryBuilder.andWhere('event.startsAt >= :startDate', {
        startDate: filter.startDate,
      });
    }

    if (filter.endDate) {
      queryBuilder.andWhere('event.endsAt <= :endDate', {
        endDate: filter.endDate,
      });
    }

    // Pagination
    const page = filter.page || 1;
    const limit = filter.limit || 10;
    const offset = (page - 1) * limit;

    queryBuilder.skip(offset).take(limit);
    queryBuilder.orderBy('event.startsAt', 'DESC');

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async checkTimeConflicts(
    participants: string[],
    timeRange: TimeRange,
  ): Promise<boolean> {
    const conflictCheck = await this.eventRepository
      .createQueryBuilder('event')
      .innerJoin('event.participants', 'participants')
      .where('participants.userId = ANY(:participants)', { participants })
      .andWhere('event.deletedAt IS NULL')
      .andWhere('event.status != :cancelledStatus', {
        cancelledStatus: EventStatus.CANCELLED,
      })
      .andWhere(
        `tstzrange(event.startsAt, event.endsAt, '[)') && tstzrange(:startsAt, :endsAt, '[)')`,
        {
          startsAt: timeRange.startsAt,
          endsAt: timeRange.endsAt,
        },
      )
      .getOne();

    return !!conflictCheck;
  }

  async softDelete(id: string): Promise<void> {
    await this.eventRepository.softDelete(id);
  }

  async findEventsByParticipant(
    userId: number,
    timeRange?: TimeRange,
  ): Promise<ScheduleEvent[]> {
    const queryBuilder = this.eventRepository
      .createQueryBuilder('event')
      .innerJoin('event.participants', 'participants')
      .leftJoinAndSelect('event.participants', 'allParticipants')
      .leftJoinAndSelect('allParticipants.user', 'user')
      .where('participants.userId = :userId', { userId })
      .andWhere('event.deletedAt IS NULL')
      .andWhere('event.status != :cancelledStatus', {
        cancelledStatus: EventStatus.CANCELLED,
      });

    if (timeRange) {
      queryBuilder.andWhere(
        `tstzrange(event.startsAt, event.endsAt, '[)') && tstzrange(:startsAt, :endsAt, '[)')`,
        {
          startsAt: timeRange.startsAt,
          endsAt: timeRange.endsAt,
        },
      );
    }

    return queryBuilder.getMany();
  }
}
