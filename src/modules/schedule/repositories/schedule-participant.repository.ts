import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ScheduleParticipant } from '../entities/schedule-participant.entity';
import { ResponseStatus } from '../enums/response-status.enum';

@Injectable()
export class ScheduleParticipantRepository {
  constructor(
    @InjectRepository(ScheduleParticipant)
    private readonly participantRepository: Repository<ScheduleParticipant>,
  ) {}

  async updateResponse(
    eventId: string,
    userId: number,
    response: ResponseStatus,
  ): Promise<ScheduleParticipant | null> {
    const updateResult = await this.participantRepository.update(
      { eventId, userId },
      { response },
    );

    if (updateResult.affected === 0) {
      return null;
    }

    return this.participantRepository.findOne({
      where: { eventId, userId },
      relations: ['user', 'event'],
    });
  }

  async findByEventAndUser(
    eventId: string,
    userId: number,
  ): Promise<ScheduleParticipant | null> {
    return this.participantRepository.findOne({
      where: { eventId, userId },
      relations: ['user', 'event'],
    });
  }

  async findByEvent(eventId: string): Promise<ScheduleParticipant[]> {
    return this.participantRepository.find({
      where: { eventId },
      relations: ['user'],
    });
  }

  async findByUser(userId: number): Promise<ScheduleParticipant[]> {
    return this.participantRepository.find({
      where: { userId },
      relations: ['event'],
    });
  }

  async bulkCreate(
    participants: Partial<ScheduleParticipant>[],
  ): Promise<ScheduleParticipant[]> {
    const entities = participants.map((participant) =>
      this.participantRepository.create(participant),
    );

    return this.participantRepository.save(entities);
  }

  async removeByEvent(eventId: string): Promise<void> {
    await this.participantRepository.delete({ eventId });
  }
}
