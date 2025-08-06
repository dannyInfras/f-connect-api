import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { User } from '@/modules/user/entities/user.entity';
import { AppLogger } from '@/shared/logger/logger.service';

import { ScheduleEvent } from '../entities/schedule-event.entity';
import { EventStatus } from '../enums/event-status.enum';
import { EventType } from '../enums/event-type.enum';
import { ParticipantRole } from '../enums/participant-role.enum';
import { ResponseStatus } from '../enums/response-status.enum';
import { ScheduleEventRepository } from '../repositories/schedule-event.repository';
import { ScheduleParticipantRepository } from '../repositories/schedule-participant.repository';
import { CreateEventData } from '../types/schedule.types';
import { ScheduleService } from './schedule.service';
import { ScheduleAclService } from './schedule-acl.service';
import { ScheduleNotificationService } from './schedule-notification.service';

describe('ScheduleService', () => {
  let service: ScheduleService;
  let scheduleRepository: jest.Mocked<ScheduleEventRepository>;
  let participantRepository: jest.Mocked<ScheduleParticipantRepository>;
  let aclService: jest.Mocked<ScheduleAclService>;
  let notificationService: jest.Mocked<ScheduleNotificationService>;
  let logger: jest.Mocked<AppLogger>;

  const mockUser: User = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    username: 'testuser',
    roles: ['RECRUITER'],
    isAccountDisabled: false,
    provider: 'local',
    createdAt: new Date(),
    updatedAt: new Date(),
    articles: [],
    company: { id: '1' } as any,
  } as User;

  const mockEvent: ScheduleEvent = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    companyId: '1',
    createdBy: '1',
    title: 'Test Interview',
    type: EventType.INTERVIEW,
    status: EventStatus.PENDING,
    startsAt: new Date('2024-02-01T10:00:00Z'),
    endsAt: new Date('2024-02-01T11:00:00Z'),
    location: 'Office',
    notes: 'Test notes',
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    company: { id: '1' } as any,
    creator: { id: 1 } as any,
    participants: [],
  } as ScheduleEvent;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScheduleService,
        {
          provide: ScheduleEventRepository,
          useValue: {
            create: jest.fn(),
            update: jest.fn(),
            findById: jest.fn(),
            findByFilter: jest.fn(),
            checkTimeConflicts: jest.fn(),
            softDelete: jest.fn(),
          },
        },
        {
          provide: ScheduleParticipantRepository,
          useValue: {
            updateResponse: jest.fn(),
            findByEventAndUser: jest.fn(),
            findByEvent: jest.fn(),
            findByUser: jest.fn(),
            bulkCreate: jest.fn(),
            removeByEvent: jest.fn(),
          },
        },
        {
          provide: ScheduleAclService,
          useValue: {
            canCreateInCompany: jest.fn(),
            forActor: jest.fn(() => ({
              canDoAction: jest.fn(),
            })),
          },
        },
        {
          provide: ScheduleNotificationService,
          useValue: {
            notifyEventCreated: jest.fn(),
            notifyEventUpdated: jest.fn(),
            notifyEventCancelled: jest.fn(),
            notifyParticipantResponse: jest.fn(),
            scheduleReminders: jest.fn(),
            cancelReminders: jest.fn(),
          },
        },
        {
          provide: AppLogger,
          useValue: {
            setContext: jest.fn(),
            log: jest.fn(),
            error: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ScheduleService>(ScheduleService);
    scheduleRepository = module.get(ScheduleEventRepository);
    participantRepository = module.get(ScheduleParticipantRepository);
    aclService = module.get(ScheduleAclService);
    notificationService = module.get(ScheduleNotificationService);
    logger = module.get(AppLogger);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createEvent', () => {
    const createEventData: CreateEventData = {
      companyId: '1',
      createdBy: '1',
      title: 'Test Interview',
      type: EventType.INTERVIEW,
      startsAt: new Date('2024-02-01T10:00:00Z'),
      endsAt: new Date('2024-02-01T11:00:00Z'),
      location: 'Office',
      notes: 'Test notes',
      participants: [
        {
          userId: '2',
          role: ParticipantRole.CANDIDATE,
        },
      ],
    };

    it('should create an event successfully', async () => {
      aclService.canCreateInCompany.mockReturnValue(true);
      scheduleRepository.checkTimeConflicts.mockResolvedValue(false);
      scheduleRepository.create.mockResolvedValue(mockEvent);

      const result = await service.createEvent(createEventData, mockUser);

      expect(aclService.canCreateInCompany).toHaveBeenCalledWith(
        expect.objectContaining({ id: mockUser.id }),
        createEventData.companyId,
      );
      expect(scheduleRepository.checkTimeConflicts).toHaveBeenCalled();
      expect(scheduleRepository.create).toHaveBeenCalled();
      expect(notificationService.notifyEventCreated).toHaveBeenCalledWith(
        mockEvent,
      );
      expect(notificationService.scheduleReminders).toHaveBeenCalledWith(
        mockEvent,
      );
      expect(result).toBeDefined();
    });

    it('should throw ForbiddenException if user cannot create events', async () => {
      aclService.canCreateInCompany.mockReturnValue(false);

      await expect(
        service.createEvent(createEventData, mockUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException if time conflicts exist', async () => {
      aclService.canCreateInCompany.mockReturnValue(true);
      scheduleRepository.checkTimeConflicts.mockResolvedValue(true);

      await expect(
        service.createEvent(createEventData, mockUser),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('cancelEvent', () => {
    it('should cancel an event successfully', async () => {
      scheduleRepository.findById.mockResolvedValue(mockEvent);
      aclService.forActor.mockReturnValue({
        canDoAction: jest.fn().mockReturnValue(true),
      });
      scheduleRepository.update.mockResolvedValue({
        ...mockEvent,
        status: EventStatus.CANCELLED,
      });

      await service.cancelEvent(mockEvent.id, mockUser);

      expect(scheduleRepository.findById).toHaveBeenCalledWith(mockEvent.id);
      expect(scheduleRepository.update).toHaveBeenCalledWith(mockEvent.id, {
        status: EventStatus.CANCELLED,
        version: mockEvent.version,
      });
      expect(notificationService.notifyEventCancelled).toHaveBeenCalled();
      expect(notificationService.cancelReminders).toHaveBeenCalledWith(
        mockEvent.id,
      );
    });

    it('should throw NotFoundException if event not found', async () => {
      scheduleRepository.findById.mockResolvedValue(null);

      await expect(
        service.cancelEvent('non-existent', mockUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user cannot delete event', async () => {
      scheduleRepository.findById.mockResolvedValue(mockEvent);
      aclService.forActor.mockReturnValue({
        canDoAction: jest.fn().mockReturnValue(false),
      });

      await expect(service.cancelEvent(mockEvent.id, mockUser)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('confirmAttendance', () => {
    it('should confirm attendance successfully', async () => {
      const participant = {
        eventId: mockEvent.id,
        userId: mockUser.id.toString(),
        role: ParticipantRole.CANDIDATE,
        response: ResponseStatus.PENDING,
        user: mockUser,
        event: mockEvent,
      };

      scheduleRepository.findById.mockResolvedValue(mockEvent);
      aclService.forActor.mockReturnValue({
        canDoAction: jest.fn().mockReturnValue(true),
      });
      participantRepository.findByEventAndUser.mockResolvedValue(participant);
      participantRepository.updateResponse.mockResolvedValue({
        ...participant,
        response: ResponseStatus.ACCEPTED,
      });

      await service.confirmAttendance(mockEvent.id, mockUser);

      expect(participantRepository.updateResponse).toHaveBeenCalledWith(
        mockEvent.id,
        mockUser.id.toString(),
        ResponseStatus.ACCEPTED,
      );
      expect(notificationService.notifyParticipantResponse).toHaveBeenCalled();
    });
  });

  describe('checkUserConflicts', () => {
    it('should check for conflicts correctly', async () => {
      const timeRange = {
        startsAt: new Date('2024-02-01T10:00:00Z'),
        endsAt: new Date('2024-02-01T11:00:00Z'),
      };

      scheduleRepository.checkTimeConflicts.mockResolvedValue(true);

      const result = await service.checkUserConflicts('user-1', timeRange);

      expect(result).toBe(true);
      expect(scheduleRepository.checkTimeConflicts).toHaveBeenCalledWith(
        ['user-1'],
        timeRange,
      );
    });
  });
});
