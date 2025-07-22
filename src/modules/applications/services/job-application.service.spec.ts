import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { ROLE } from '@/modules/auth/constants/role.constant';
import { UserService } from '@/modules/user/services/user.service';
import { EventEmitterService } from '@/shared/events/event-emitter.service';
import { AppLogger } from '@/shared/logger/logger.service';
import { RequestContext } from '@/shared/request-context/request-context.dto';
import { UnitOfWork } from '@/shared/unit-of-work/unit-of-work.service';

import { UserAccessTokenClaims } from '../../auth/dtos/auth-token-output.dto';
import { JobApplicationAclService } from '../acl/job-application-acl.service';
import { CreateJobApplicationDto } from '../dtos/create-job-application.dto';
import { UpdateJobApplicationDto } from '../dtos/update-job-application.dto';
import { ApplicationStatus } from '../enums/application-status.enum';
import { JobApplicationRepository } from '../repositories/job-application.repository';
import { JobApplicationService } from './job-application.service';
import { JobApplicationNotificationService } from './job-application-notification.service';

describe('JobApplicationService', () => {
  let service: JobApplicationService;
  let jobApplicationRepository: jest.Mocked<JobApplicationRepository>;
  let aclService: jest.Mocked<JobApplicationAclService>;
  let notificationService: jest.Mocked<JobApplicationNotificationService>;
  let unitOfWork: jest.Mocked<UnitOfWork>;
  let logger: jest.Mocked<AppLogger>;
  let userService: jest.Mocked<UserService>;
  let eventEmitter: jest.Mocked<EventEmitterService>;

  const mockUser: UserAccessTokenClaims = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    roles: [ROLE.USER],
    companyId: null,
  };

  const mockUserOutput = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    name: 'Test User',
    roles: [ROLE.USER],
    isAccountDisabled: false,
    address: '123 Test St',
    companyId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCreateApplicationDto: CreateJobApplicationDto = {
    jobId: 1,
    cvId: 'test-cv-id',
    coverLetter: 'Test cover letter',
  };

  const mockUpdateApplicationDto: UpdateJobApplicationDto = {
    status: ApplicationStatus.INTERVIEW,
  };

  const mockCreateResponse = {
    id: 1,
    status: ApplicationStatus.APPLIED,
    applied_at: new Date(),
  };

  const mockAclServiceMethods = {
    forActor: jest.fn(() => ({
      canDoAction: jest.fn(),
    })),
  };

  beforeEach(async () => {
    const mockJobApplicationRepository = {
      createApplicationEntity: jest.fn(),
      findApplicationWithRelations: jest.fn(),
      mapToEmailNotificationData: jest.fn(),
      findByUserId: jest.fn(),
      findByJobId: jest.fn(),
      findOne: jest.fn(),
      updateApplication: jest.fn(),
      findApplicationWithFullDetails: jest.fn(),
      findCandidateProfile: jest.fn(),
      mapToApplicationDetailResponse: jest.fn(),
      findApplicationWithCompanyProfile: jest.fn(),
      mapToCandidateApplicationDetailResponse: jest.fn(),
      findAllApplications: jest.fn(),
    };

    const mockNotificationService = {
      sendApplicationSuccessEmail: jest.fn(),
    };

    const mockUnitOfWork = {
      doTransactional: jest.fn(),
    };

    const mockLogger = {
      setContext: jest.fn(),
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    };

    const mockUserService = {
      findById: jest.fn(),
    };

    const mockEventEmitter = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobApplicationService,
        {
          provide: JobApplicationRepository,
          useValue: mockJobApplicationRepository,
        },
        {
          provide: JobApplicationAclService,
          useValue: mockAclServiceMethods,
        },
        {
          provide: JobApplicationNotificationService,
          useValue: mockNotificationService,
        },
        {
          provide: UnitOfWork,
          useValue: mockUnitOfWork,
        },
        {
          provide: AppLogger,
          useValue: mockLogger,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: EventEmitterService,
          useValue: mockEventEmitter,
        },
      ],
    }).compile();

    service = module.get<JobApplicationService>(JobApplicationService);
    jobApplicationRepository = module.get(JobApplicationRepository);
    aclService = module.get(JobApplicationAclService);
    notificationService = module.get(JobApplicationNotificationService);
    unitOfWork = module.get(UnitOfWork);
    logger = module.get(AppLogger);
    userService = module.get(UserService);
    eventEmitter = module.get(EventEmitterService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createApplication', () => {
    it('should successfully create a job application', async () => {
      // Mock the transactional workflow
      unitOfWork.doTransactional.mockImplementation(async (callback) => {
        const mockEntityManager = {
          getRepository: jest.fn(() => ({
            findOne: jest.fn().mockResolvedValue(null), // No existing application
          })),
          save: jest.fn().mockResolvedValue({
            id: 1,
            status: ApplicationStatus.APPLIED,
            applied_at: new Date(),
          }),
        };
        return await callback(mockEntityManager);
      });

      jobApplicationRepository.createApplicationEntity.mockResolvedValue({
        id: 1,
        status: ApplicationStatus.APPLIED,
        applied_at: new Date(),
      } as any);

      aclService.forActor.mockReturnValue({
        canDoAction: jest.fn().mockReturnValue(true),
      } as any);

      jobApplicationRepository.findApplicationWithRelations.mockResolvedValue({
        id: 1,
        user: { name: 'Test User', email: 'test@example.com' },
        job: {
          title: 'Software Engineer',
          company: { companyName: 'Test Company' },
        },
        applied_at: new Date(),
      } as any);

      jobApplicationRepository.mapToEmailNotificationData.mockReturnValue({
        to: 'test@example.com',
        applicantName: 'Test User',
        jobTitle: 'Software Engineer',
        companyName: 'Test Company',
        appliedDate: '2024-01-15',
        cvSubmitted: true,
      });

      const result = await service.createApplication({
        dto: mockCreateApplicationDto,
        user: mockUser,
      });

      expect(result).toEqual(mockCreateResponse);
      expect(unitOfWork.doTransactional).toHaveBeenCalled();
      expect(
        notificationService.sendApplicationSuccessEmail,
      ).toHaveBeenCalled();
    });

    it('should throw BadRequestException if user already applied', async () => {
      unitOfWork.doTransactional.mockImplementation(async (callback) => {
        const mockEntityManager = {
          getRepository: jest.fn(() => ({
            findOne: jest.fn().mockResolvedValue({ id: 1 }), // Existing application
          })),
        };
        return await callback(mockEntityManager);
      });

      await expect(
        service.createApplication({
          dto: mockCreateApplicationDto,
          user: mockUser,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw UnauthorizedException if user is not authorized', async () => {
      unitOfWork.doTransactional.mockImplementation(async (callback) => {
        const mockEntityManager = {
          getRepository: jest.fn(() => ({
            findOne: jest.fn().mockResolvedValue(null),
          })),
        };
        return await callback(mockEntityManager);
      });

      jobApplicationRepository.createApplicationEntity.mockResolvedValue({
        id: 1,
        status: ApplicationStatus.APPLIED,
        applied_at: new Date(),
      } as any);

      aclService.forActor.mockReturnValue({
        canDoAction: jest.fn().mockReturnValue(false),
      } as any);

      await expect(
        service.createApplication({
          dto: mockCreateApplicationDto,
          user: mockUser,
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getUserApplications', () => {
    it('should return user applications', async () => {
      const mockApplications = [
        { id: 1, status: ApplicationStatus.APPLIED, applied_at: new Date() },
      ];

      jobApplicationRepository.findByUserId.mockResolvedValue({
        applications: mockApplications,
        count: 1,
      });

      aclService.forActor.mockReturnValue({
        canDoAction: jest.fn().mockReturnValue(true),
      } as any);

      const result = await service.getUserApplications({
        user: mockUser,
        limit: 10,
        offset: 0,
      });

      expect(result).toEqual({
        applications: mockApplications,
        count: 1,
      });
      expect(jobApplicationRepository.findByUserId).toHaveBeenCalledWith({
        userId: mockUser.id,
        limit: 10,
        offset: 0,
      });
    });
  });

  describe('updateApplication', () => {
    it('should successfully update application status', async () => {
      const mockApplication = {
        id: 1,
        status: ApplicationStatus.APPLIED,
        user: { id: 1 },
        job: {
          id: '1',
          title: 'Software Engineer',
          company: { companyName: 'Test Company' },
        },
      };

      jobApplicationRepository.findOne.mockResolvedValue(
        mockApplication as any,
      );
      aclService.forActor.mockReturnValue({
        canDoAction: jest.fn().mockReturnValue(true),
      } as any);

      const result = await service.updateApplication({
        id: 1,
        dto: mockUpdateApplicationDto,
        user: mockUser,
      });

      expect(result).toEqual({
        message: 'Application status updated successfully',
        success: true,
      });
      expect(jobApplicationRepository.updateApplication).toHaveBeenCalledWith(
        1,
        {
          status: ApplicationStatus.INTERVIEW,
        },
      );
    });

    it('should throw NotFoundException if application not found', async () => {
      jobApplicationRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateApplication({
          id: 999,
          dto: mockUpdateApplicationDto,
          user: mockUser,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw UnauthorizedException if user cannot update', async () => {
      const mockApplication = {
        id: 1,
        status: ApplicationStatus.APPLIED,
        user: { id: 2 }, // Different user
        job: { id: '1' },
      };

      jobApplicationRepository.findOne.mockResolvedValue(
        mockApplication as any,
      );
      aclService.forActor.mockReturnValue({
        canDoAction: jest.fn().mockReturnValue(false),
      } as any);

      await expect(
        service.updateApplication({
          id: 1,
          dto: mockUpdateApplicationDto,
          user: mockUser,
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getApplicationById', () => {
    it('should return application details', async () => {
      const mockApplication = {
        id: 1,
        user: { id: 1 },
        job: { id: '1', company: { id: '1', users: [{ id: 1 }] } },
      };

      const mockDetailResponse = {
        id: 1,
        status: ApplicationStatus.APPLIED,
        applied_at: new Date(),
      };

      jobApplicationRepository.findApplicationWithFullDetails.mockResolvedValue(
        mockApplication as any,
      );
      aclService.forActor.mockReturnValue({
        canDoAction: jest.fn().mockReturnValue(true),
      } as any);
      jobApplicationRepository.findCandidateProfile.mockResolvedValue({});
      jobApplicationRepository.mapToApplicationDetailResponse.mockReturnValue(
        mockDetailResponse as any,
      );

      const result = await service.getApplicationById(1, mockUser);

      expect(result).toEqual(mockDetailResponse);
      expect(
        jobApplicationRepository.findApplicationWithFullDetails,
      ).toHaveBeenCalledWith({
        applicationId: 1,
      });
    });

    it('should throw NotFoundException if application not found', async () => {
      jobApplicationRepository.findApplicationWithFullDetails.mockResolvedValue(
        null,
      );

      await expect(service.getApplicationById(999, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getHrApplications', () => {
    const mockHrUser: UserAccessTokenClaims = {
      ...mockUser,
      roles: [ROLE.RECRUITER],
      companyId: '1',
    };

    it('should return HR applications', async () => {
      userService.findById.mockResolvedValue(mockUserOutput);
      jobApplicationRepository.findAllApplications.mockResolvedValue({
        applications: [],
        count: 0,
      });

      const result = await service.getHrApplications({
        user: mockHrUser,
        limit: 10,
        offset: 0,
      });

      expect(result).toEqual({
        applications: [],
        count: 0,
      });
    });

    it('should throw UnauthorizedException for non-HR users', async () => {
      await expect(
        service.getHrApplications({
          user: mockUser, // Regular user, not HR
          limit: 10,
          offset: 0,
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
