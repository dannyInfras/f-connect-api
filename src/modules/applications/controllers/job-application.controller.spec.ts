import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { ROLE } from '@/modules/auth/constants/role.constant';
import { RequestContext } from '@/shared/request-context/request-context.dto';

import { UserAccessTokenClaims } from '../../auth/dtos/auth-token-output.dto';
import { CreateJobApplicationDto } from '../dtos/create-job-application.dto';
import { UpdateJobApplicationDto } from '../dtos/update-job-application.dto';
import { ApplicationStatus } from '../enums/application-status.enum';
import { JobApplicationService } from '../services/job-application.service';
import { JobApplicationController } from './job-application.controller';

describe('JobApplicationController', () => {
  let controller: JobApplicationController;
  let jobApplicationService: jest.Mocked<JobApplicationService>;

  const mockUserClaims: UserAccessTokenClaims = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    roles: [ROLE.USER],
    companyId: null,
  };

  const mockRequestContext: RequestContext = {
    requestID: 'test-request-id',
    url: '/test',
    ip: '127.0.0.1',
    user: mockUserClaims,
  };

  const mockApplicationResponse = {
    id: 1,
    status: ApplicationStatus.APPLIED,
    applied_at: new Date(),
  };

  const mockApplicationsResponse = {
    applications: [
      {
        id: 1,
        status: ApplicationStatus.APPLIED,
        applied_at: new Date(),
        user: { id: 1, name: 'Test User' },
        job: { id: '1', title: 'Software Engineer' },
      },
    ],
    count: 1,
  };

  beforeEach(async () => {
    const mockJobApplicationService = {
      createApplication: jest.fn(),
      updateApplication: jest.fn(),
      getUserApplications: jest.fn(),
      getJobApplications: jest.fn(),
      getJobApplicationsSimplified: jest.fn(),
      getApplicationById: jest.fn(),
      getApplicationByIdForCandidate: jest.fn(),
      getHrApplications: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [JobApplicationController],
      providers: [
        {
          provide: JobApplicationService,
          useValue: mockJobApplicationService,
        },
      ],
    }).compile();

    controller = module.get<JobApplicationController>(JobApplicationController);
    jobApplicationService = module.get(JobApplicationService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const createJobApplicationDto: CreateJobApplicationDto = {
      jobId: 1,
      cvId: 'test-cv-id',
      coverLetter: 'Test cover letter',
    };

    it('should successfully create a job application', async () => {
      jobApplicationService.createApplication.mockResolvedValue(
        mockApplicationResponse,
      );

      const result = await controller.create(
        createJobApplicationDto,
        mockRequestContext,
      );

      expect(result).toEqual({
        data: {
          id: mockApplicationResponse.id.toString(),
          status: mockApplicationResponse.status,
          applied_at: mockApplicationResponse.applied_at,
        },
        meta: {
          message: 'Application created successfully',
        },
      });
      expect(jobApplicationService.createApplication).toHaveBeenCalledWith({
        dto: createJobApplicationDto,
        user: mockUserClaims,
      });
    });

    it('should throw BadRequestException when service throws BadRequestException', async () => {
      jobApplicationService.createApplication.mockRejectedValue(
        new BadRequestException('User has already applied for this job'),
      );

      await expect(
        controller.create(createJobApplicationDto, mockRequestContext),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    const updateJobApplicationDto: UpdateJobApplicationDto = {
      status: ApplicationStatus.INTERVIEW,
    };

    it('should successfully update a job application', async () => {
      const mockUpdateResponse = {
        message: 'Application status updated successfully',
        success: true,
      };

      jobApplicationService.updateApplication.mockResolvedValue(
        mockUpdateResponse,
      );

      const result = await controller.update(
        '1',
        updateJobApplicationDto,
        mockRequestContext,
      );

      expect(result).toEqual(mockUpdateResponse);
      expect(jobApplicationService.updateApplication).toHaveBeenCalledWith({
        id: 1,
        dto: updateJobApplicationDto,
        user: mockUserClaims,
      });
    });

    it('should throw NotFoundException when application does not exist', async () => {
      jobApplicationService.updateApplication.mockRejectedValue(
        new NotFoundException('Job application not found'),
      );

      await expect(
        controller.update('999', updateJobApplicationDto, mockRequestContext),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw UnauthorizedException when user cannot update application', async () => {
      jobApplicationService.updateApplication.mockRejectedValue(
        new UnauthorizedException('User cannot update this application status'),
      );

      await expect(
        controller.update('1', updateJobApplicationDto, mockRequestContext),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getUserApplications', () => {
    it('should successfully get user applications', async () => {
      jobApplicationService.getUserApplications.mockResolvedValue(
        mockApplicationsResponse,
      );

      const result = await controller.getUserApplications(
        '10',
        '0',
        mockRequestContext,
      );

      expect(result).toEqual({
        data: mockApplicationsResponse.applications,
        meta: {
          count: mockApplicationsResponse.count,
        },
      });
      expect(jobApplicationService.getUserApplications).toHaveBeenCalledWith({
        user: mockUserClaims,
        limit: 10,
        offset: 0,
      });
    });

    it('should use default parameters when not provided', async () => {
      jobApplicationService.getUserApplications.mockResolvedValue(
        mockApplicationsResponse,
      );

      await controller.getUserApplications(
        undefined,
        undefined,
        mockRequestContext,
      );

      expect(jobApplicationService.getUserApplications).toHaveBeenCalledWith({
        user: mockUserClaims,
        limit: 10,
        offset: 0,
      });
    });
  });

  describe('getJobApplications', () => {
    it('should successfully get job applications', async () => {
      jobApplicationService.getJobApplications.mockResolvedValue(
        mockApplicationsResponse,
      );

      const result = await controller.getJobApplications(
        '1',
        '10',
        '0',
        mockRequestContext,
      );

      expect(result).toEqual({
        data: mockApplicationsResponse.applications,
        meta: {
          count: mockApplicationsResponse.count,
        },
      });
      expect(jobApplicationService.getJobApplications).toHaveBeenCalledWith({
        jobId: '1',
        user: mockUserClaims,
        limit: 10,
        offset: 0,
      });
    });
  });

  describe('getApplicationDetail', () => {
    it('should successfully get application detail for HR/recruiter', async () => {
      const mockDetailResponse = {
        id: 1,
        status: ApplicationStatus.APPLIED,
        applied_at: new Date(),
        ai_status: 'COMPLETED',
        ai_score: 85,
        ai_analysis: 'Strong candidate',
        candidate: { id: 1, name: 'Test User' },
        job: { id: '1', title: 'Software Engineer' },
      };

      jobApplicationService.getApplicationById.mockResolvedValue(
        mockDetailResponse as any,
      );

      const result = await controller.getApplicationDetail(
        '1',
        mockRequestContext,
      );

      expect(result).toEqual(mockDetailResponse);
      expect(jobApplicationService.getApplicationById).toHaveBeenCalledWith(
        1,
        mockUserClaims,
      );
    });

    it('should throw NotFoundException when application does not exist', async () => {
      jobApplicationService.getApplicationById.mockRejectedValue(
        new NotFoundException('Application not found'),
      );

      await expect(
        controller.getApplicationDetail('999', mockRequestContext),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw UnauthorizedException when user cannot access application', async () => {
      jobApplicationService.getApplicationById.mockRejectedValue(
        new UnauthorizedException('User cannot access this application'),
      );

      await expect(
        controller.getApplicationDetail('1', mockRequestContext),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getHrApplications', () => {
    const mockRecruiterClaims: UserAccessTokenClaims = {
      ...mockUserClaims,
      roles: [ROLE.RECRUITER],
      companyId: '1',
    };

    const mockRecruiterContext: RequestContext = {
      ...mockRequestContext,
      user: mockRecruiterClaims,
    };

    it('should successfully get HR applications', async () => {
      jobApplicationService.getHrApplications.mockResolvedValue({
        applications: [],
        count: 0,
      });

      const result = await controller.getHrApplications(
        '10',
        '0',
        mockRecruiterContext,
      );

      expect(result).toEqual({
        data: [],
        meta: { count: 0 },
      });
      expect(jobApplicationService.getHrApplications).toHaveBeenCalledWith({
        user: mockRecruiterClaims,
        limit: 10,
        offset: 0,
      });
    });
  });

  describe('getApplicationByIdForUser', () => {
    it('should successfully get candidate application detail', async () => {
      const mockCandidateDetailResponse = {
        id: 1,
        status: ApplicationStatus.APPLIED,
        cv_id: 'test-cv-id',
        cover_letter: 'Test cover letter',
        applied_at: new Date(),
        updated_at: new Date(),
        job: {
          id: '1',
          title: 'Software Engineer',
        },
        company: {
          id: '1',
          name: 'Test Company',
          logoUrl: 'logo.png',
          website: 'https://test.com',
          phone: '1234567890',
          email: 'contact@test.com',
          about: 'Test company description',
          contact: 'HR Team',
        },
      };

      jobApplicationService.getApplicationByIdForCandidate.mockResolvedValue(
        mockCandidateDetailResponse as any,
      );

      const result = await controller.getApplicationByIdForUser(
        '1',
        mockRequestContext,
      );

      expect(result).toEqual(mockCandidateDetailResponse);
      expect(
        jobApplicationService.getApplicationByIdForCandidate,
      ).toHaveBeenCalledWith(1, mockUserClaims);
    });
  });

  describe('getApplicationById', () => {
    it('should successfully get application by ID', async () => {
      const mockResponse = {
        id: 1,
        status: ApplicationStatus.APPLIED,
        cv_id: 'test-cv-id',
        cover_letter: 'Test cover letter',
        applied_at: new Date(),
        updated_at: new Date(),
      };

      jobApplicationService.getApplicationById.mockResolvedValue(
        mockResponse as any,
      );

      const result = await controller.getApplicationById(
        '1',
        mockRequestContext,
      );

      expect(result).toEqual({
        data: {
          id: mockResponse.id.toString(),
          status: mockResponse.status,
          cv_id: mockResponse.cv_id,
          cover_letter: mockResponse.cover_letter,
          applied_at: mockResponse.applied_at,
          updated_at: mockResponse.updated_at,
        },
      });
      expect(jobApplicationService.getApplicationById).toHaveBeenCalledWith(
        1,
        mockUserClaims,
      );
    });
  });
});
