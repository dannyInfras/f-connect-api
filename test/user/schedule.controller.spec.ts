import { Test, TestingModule } from '@nestjs/testing';

import { ScheduleController } from '@/modules/schedule/controllers/schedule.controller';
import { CreateScheduleEventDto } from '@/modules/schedule/dtos/create-schedule-event.dto';
import { ScheduleEventResponseDto } from '@/modules/schedule/dtos/schedule-event-response.dto';
import { UpdateScheduleEventDto } from '@/modules/schedule/dtos/update-schedule-event.dto';
import { EventStatus } from '@/modules/schedule/enums/event-status.enum';
import { EventType } from '@/modules/schedule/enums/event-type.enum';
import { ParticipantRole } from '@/modules/schedule/enums/participant-role.enum';
import { ScheduleService } from '@/modules/schedule/services/schedule.service';
import { User } from '@/modules/user/entities/user.entity';

describe('ScheduleController (unit)', () => {
  let controller: ScheduleController;
  let scheduleService: jest.Mocked<ScheduleService>;

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

  const mockEvent: ScheduleEventResponseDto = {
    id: 'event-1',
    companyId: '1',
    companyName: 'Acme Inc',
    createdBy: '1',
    title: 'Test Interview',
    type: EventType.INTERVIEW,
    status: EventStatus.PENDING,
    startsAt: new Date('2025-01-01T10:00:00Z'),
    endsAt: new Date('2025-01-01T11:00:00Z'),
    location: 'Office',
    notes: 'Bring portfolio',
    applicationId: 10,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    participants: [],
  } as ScheduleEventResponseDto;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ScheduleController],
      providers: [
        {
          provide: ScheduleService,
          useValue: {
            createEvent: jest.fn(),
            fetchEvents: jest.fn(),
            getEventById: jest.fn(),
            updateEvent: jest.fn(),
            cancelEvent: jest.fn(),
            confirmAttendance: jest.fn(),
            declineAttendance: jest.fn(),
            rescheduleEvent: jest.fn(),
            getUserUpcomingEvents: jest.fn(),
            checkUserConflicts: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ScheduleController>(ScheduleController);
    scheduleService = module.get(ScheduleService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createEvent', () => {
    it('should map DTO and call service to create event', async () => {
      const dto: CreateScheduleEventDto = {
        title: 'Interview',
        type: EventType.INTERVIEW,
        startsAt: '2025-01-01T10:00:00Z',
        endsAt: '2025-01-01T11:00:00Z',
        location: 'Office',
        notes: 'Be on time',
        applicationId: 10,
        participants: [
          { userId: 2, role: ParticipantRole.CANDIDATE },
          { userId: 3, role: ParticipantRole.INTERVIEWER },
        ],
      };
      const companyId = 1;
      (scheduleService.createEvent as jest.Mock).mockResolvedValue(mockEvent);

      const result = await controller.createEvent(companyId, dto, mockUser);

      expect(scheduleService.createEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          companyId: companyId.toString(),
          title: dto.title,
          type: dto.type,
          startsAt: new Date(dto.startsAt),
          endsAt: new Date(dto.endsAt),
          location: dto.location,
          notes: dto.notes,
          applicationId: dto.applicationId,
          participants: dto.participants,
          createdBy: mockUser.id,
        }),
        mockUser,
      );
      expect(result).toBe(mockEvent);
    });
  });

  describe('getCompanyEvents', () => {
    it('should build filter with defaults and call service', async () => {
      const companyId = 1;
      const type = EventType.MEETING;
      const status = EventStatus.CONFIRMED;
      const startDate = '2025-02-01T00:00:00Z';
      const endDate = '2025-02-28T23:59:59Z';
      (scheduleService.fetchEvents as jest.Mock).mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      });

      await controller.getCompanyEvents(
        companyId,
        mockUser,
        type,
        status,
        startDate,
        endDate,
        undefined,
        undefined,
      );

      expect(scheduleService.fetchEvents).toHaveBeenCalledWith(
        expect.objectContaining({
          companyId: companyId.toString(),
          type,
          status,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          page: 1,
          limit: 10,
        }),
        mockUser,
      );
    });
  });

  describe('getUserEvents', () => {
    it('should build user filter and call service', async () => {
      (scheduleService.fetchEvents as jest.Mock).mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      });

      await controller.getUserEvents(
        mockUser,
        EventType.INTERVIEW,
        EventStatus.PENDING,
        undefined,
        undefined,
        undefined,
        undefined,
      );

      expect(scheduleService.fetchEvents).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUser.id,
          type: EventType.INTERVIEW,
          status: EventStatus.PENDING,
          page: 1,
          limit: 10,
        }),
        mockUser,
      );
    });
  });

  describe('getEventById', () => {
    it('should call service to get event', async () => {
      (scheduleService.getEventById as jest.Mock).mockResolvedValue(mockEvent);

      const result = await controller.getEventById('event-1', mockUser);

      expect(scheduleService.getEventById).toHaveBeenCalledWith(
        'event-1',
        mockUser,
      );
      expect(result).toBe(mockEvent);
    });
  });

  describe('updateEvent', () => {
    it('should map dates and default version then call service', async () => {
      const updateDto: UpdateScheduleEventDto = {
        title: 'Updated',
        type: EventType.MEETING,
        status: EventStatus.CONFIRMED,
        startsAt: '2025-01-01T12:00:00Z',
        endsAt: '2025-01-01T13:00:00Z',
        location: 'Room B',
        notes: 'Updated notes',
      };
      (scheduleService.updateEvent as jest.Mock).mockResolvedValue({
        ...mockEvent,
        ...{ title: updateDto.title },
      });

      const result = await controller.updateEvent(
        'event-1',
        updateDto,
        mockUser,
      );

      expect(scheduleService.updateEvent).toHaveBeenCalledWith(
        'event-1',
        expect.objectContaining({
          title: updateDto.title,
          type: updateDto.type,
          status: updateDto.status,
          startsAt: new Date(updateDto.startsAt!),
          endsAt: new Date(updateDto.endsAt!),
          location: updateDto.location,
          notes: updateDto.notes,
          version: 1,
        }),
        mockUser,
      );
      expect(result.title).toBe('Updated');
    });
  });

  describe('cancelEvent', () => {
    it('should call service to cancel event', async () => {
      (scheduleService.cancelEvent as jest.Mock).mockResolvedValue(undefined);

      await controller.cancelEvent('event-1', mockUser);

      expect(scheduleService.cancelEvent).toHaveBeenCalledWith(
        'event-1',
        mockUser,
      );
    });
  });

  describe('confirmAttendance', () => {
    it('should call service to confirm attendance', async () => {
      (scheduleService.confirmAttendance as jest.Mock).mockResolvedValue(
        undefined,
      );

      await controller.confirmAttendance('event-1', mockUser);

      expect(scheduleService.confirmAttendance).toHaveBeenCalledWith(
        'event-1',
        mockUser,
      );
    });
  });

  describe('declineAttendance', () => {
    it('should call service to decline attendance', async () => {
      (scheduleService.declineAttendance as jest.Mock).mockResolvedValue(
        undefined,
      );

      await controller.declineAttendance('event-1', mockUser);

      expect(scheduleService.declineAttendance).toHaveBeenCalledWith(
        'event-1',
        mockUser,
      );
    });
  });

  describe('rescheduleEvent', () => {
    it('should map time range and call service to reschedule', async () => {
      (scheduleService.rescheduleEvent as jest.Mock).mockResolvedValue(
        mockEvent,
      );

      const startsAt = '2025-01-02T10:00:00Z';
      const endsAt = '2025-01-02T11:00:00Z';

      await controller.rescheduleEvent(
        'event-1',
        { startsAt, endsAt },
        mockUser,
      );

      expect(scheduleService.rescheduleEvent).toHaveBeenCalledWith(
        'event-1',
        { startsAt: new Date(startsAt), endsAt: new Date(endsAt) },
        mockUser,
      );
    });
  });

  describe('getUserUpcomingEvents', () => {
    it('should call service and map to response DTOs', async () => {
      const event = {
        ...mockEvent,
        company: { companyName: 'Acme Inc' },
      } as any;
      (scheduleService.getUserUpcomingEvents as jest.Mock).mockResolvedValue([
        event,
      ]);

      const result = await controller.getUserUpcomingEvents(1, mockUser);

      expect(scheduleService.getUserUpcomingEvents).toHaveBeenCalledWith(1);
      expect(Array.isArray(result)).toBe(true);
      expect(result[0].companyName).toBe('Acme Inc');
      expect(result[0]).toHaveProperty('id');
    });
  });

  describe('checkUserConflicts', () => {
    it('should call service and return hasConflicts', async () => {
      (scheduleService.checkUserConflicts as jest.Mock).mockResolvedValue(true);

      const result = await controller.checkUserConflicts(
        1,
        { startsAt: '2025-02-01T10:00:00Z', endsAt: '2025-02-01T11:00:00Z' },
        mockUser,
      );

      expect(scheduleService.checkUserConflicts).toHaveBeenCalledWith(1, {
        startsAt: new Date('2025-02-01T10:00:00Z'),
        endsAt: new Date('2025-02-01T11:00:00Z'),
      });
      expect(result).toEqual({ hasConflicts: true });
    });
  });
});
