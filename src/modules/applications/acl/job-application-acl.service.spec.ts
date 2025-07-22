import { Test, TestingModule } from '@nestjs/testing';

import { ROLE } from '@/modules/auth/constants/role.constant';
import { Actor } from '@/shared/acl/actor.constant';

import { JobApplication } from '../entities/job-application.entity';
import { ApplicationStatus } from '../enums/application-status.enum';
import { JobApplicationAclService } from './job-application-acl.service';

describe('JobApplicationAclService', () => {
  let service: JobApplicationAclService;

  const mockUserActor: Actor = {
    id: 1,
    roles: [ROLE.USER],
  };

  const mockRecruiterActor: Actor = {
    id: 2,
    roles: [ROLE.RECRUITER],
  };

  const mockAdminRecruiterActor: Actor = {
    id: 3,
    roles: [ROLE.ADMIN_RECRUITER],
  };

  const mockJobApplication: Partial<JobApplication> = {
    id: 1,
    user: {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      password: 'hashedpassword',
      name: 'Test User',
      roles: [ROLE.USER],
      isAccountDisabled: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any,
    job: {
      id: '1',
      title: 'Software Engineer',
      description: 'Test job description',
      requirements: 'Test requirements',
      benefits: 'Test benefits',
      location: 'Remote',
      jobType: 'FULL_TIME',
      salaryMin: 50000,
      salaryMax: 80000,
      experienceLevel: 'MID',
      isActive: true,
      postedAt: new Date(),
      expiresAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      company: {
        id: '1',
        name: 'Test Company',
        logo: 'logo.png',
        description: 'Test company description',
        website: 'https://test.com',
        size: '50-100',
        location: 'Remote',
        industry: 'Technology',
        foundedYear: 2020,
        contactEmail: 'contact@test.com',
        contactPhone: '+1234567890',
        users: [
          {
            id: 2,
            username: 'recruiter',
            email: 'recruiter@example.com',
            password: 'hashedpassword',
            name: 'Recruiter User',
            roles: [ROLE.RECRUITER],
            isAccountDisabled: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          } as any,
        ],
        isVerified: true,
        isActive: true,
        jobs: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any,
      category: {
        id: '1',
        name: 'Technology',
        description: 'Tech jobs',
        createdAt: new Date(),
        updatedAt: new Date(),
        jobs: [],
      } as any,
      applications: [],
      viewCount: 0,
      applicationCount: 0,
    } as any,
    cv_id: 'test-cv-id',
    cover_letter: 'Test cover letter',
    status: ApplicationStatus.APPLIED,
    applied_at: new Date(),
    updated_at: new Date(),
    ai_score: 85,
    ai_analysis: 'Good candidate',
    ai_status: 'PENDING',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JobApplicationAclService],
    }).compile();

    service = module.get<JobApplicationAclService>(JobApplicationAclService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('isOwner', () => {
    it('should return true when user owns the application', () => {
      const result = service.isOwner(
        mockJobApplication as JobApplication,
        mockUserActor,
      );
      expect(result).toBe(true);
    });

    it('should return false when user does not own the application', () => {
      const otherUserApplication = {
        ...mockJobApplication,
        user: { ...mockJobApplication.user, id: 999 },
      };
      const result = service.isOwner(
        otherUserApplication as JobApplication,
        mockUserActor,
      );
      expect(result).toBe(false);
    });
  });

  describe('isRecruiterFromSameCompany', () => {
    it('should return true when recruiter is from same company', () => {
      const result = service.isRecruiterFromSameCompany(
        mockJobApplication as JobApplication,
        mockRecruiterActor,
      );
      expect(result).toBe(true);
    });

    it('should return false when recruiter is not from same company', () => {
      const otherRecruiter: Actor = { ...mockRecruiterActor, id: 999 };
      const result = service.isRecruiterFromSameCompany(
        mockJobApplication as JobApplication,
        otherRecruiter,
      );
      expect(result).toBe(false);
    });

    it('should return false when job has no company', () => {
      const applicationWithoutCompany = {
        ...mockJobApplication,
        job: { ...mockJobApplication.job, company: null },
      };
      const result = service.isRecruiterFromSameCompany(
        applicationWithoutCompany as JobApplication,
        mockRecruiterActor,
      );
      expect(result).toBe(false);
    });

    it('should return false when company has no users', () => {
      const applicationWithoutUsers = {
        ...mockJobApplication,
        job: {
          ...mockJobApplication.job,
          company: { ...mockJobApplication.job!.company!, users: [] },
        },
      };
      const result = service.isRecruiterFromSameCompany(
        applicationWithoutUsers as JobApplication,
        mockRecruiterActor,
      );
      expect(result).toBe(false);
    });

    it('should return false when company users is not an array', () => {
      const applicationWithInvalidUsers = {
        ...mockJobApplication,
        job: {
          ...mockJobApplication.job,
          company: { ...mockJobApplication.job!.company!, users: null as any },
        },
      };
      const result = service.isRecruiterFromSameCompany(
        applicationWithInvalidUsers as JobApplication,
        mockRecruiterActor,
      );
      expect(result).toBe(false);
    });
  });

  describe('isAdminRecruiterOrFromSameCompany', () => {
    it('should return true for admin recruiter regardless of company', () => {
      const result = service.isAdminRecruiterOrFromSameCompany(
        mockJobApplication as JobApplication,
        mockAdminRecruiterActor,
      );
      expect(result).toBe(true);
    });

    it('should return true for regular recruiter from same company', () => {
      const result = service.isAdminRecruiterOrFromSameCompany(
        mockJobApplication as JobApplication,
        mockRecruiterActor,
      );
      expect(result).toBe(true);
    });

    it('should return false for regular recruiter from different company', () => {
      const otherRecruiter: Actor = {
        ...mockRecruiterActor,
        id: 999,
        roles: [ROLE.RECRUITER],
      };
      const result = service.isAdminRecruiterOrFromSameCompany(
        mockJobApplication as JobApplication,
        otherRecruiter,
      );
      expect(result).toBe(false);
    });

    it('should return true for admin recruiter even without company', () => {
      const applicationWithoutCompany = {
        ...mockJobApplication,
        job: { ...mockJobApplication.job, company: null },
      };
      const result = service.isAdminRecruiterOrFromSameCompany(
        applicationWithoutCompany as JobApplication,
        mockAdminRecruiterActor,
      );
      expect(result).toBe(true);
    });
  });

  describe('isFromSameCompany', () => {
    it('should return true for admin recruiter', () => {
      const result = service.isFromSameCompany(
        mockJobApplication as JobApplication,
        mockAdminRecruiterActor,
      );
      expect(result).toBe(true);
    });

    it('should return true when user is from same company', () => {
      const result = service.isFromSameCompany(
        mockJobApplication as JobApplication,
        mockRecruiterActor,
      );
      expect(result).toBe(true);
    });

    it('should return false when user is not from same company', () => {
      const otherUser: Actor = { ...mockRecruiterActor, id: 999 };
      const result = service.isFromSameCompany(
        mockJobApplication as JobApplication,
        otherUser,
      );
      expect(result).toBe(false);
    });

    it('should return false when job has no company', () => {
      const applicationWithoutCompany = {
        ...mockJobApplication,
        job: { ...mockJobApplication.job, company: null },
      };
      const result = service.isFromSameCompany(
        applicationWithoutCompany as JobApplication,
        mockRecruiterActor,
      );
      expect(result).toBe(false);
    });

    it('should return false when company has no users', () => {
      const applicationWithoutUsers = {
        ...mockJobApplication,
        job: {
          ...mockJobApplication.job,
          company: { ...mockJobApplication.job!.company!, users: [] },
        },
      };
      const result = service.isFromSameCompany(
        applicationWithoutUsers as JobApplication,
        mockRecruiterActor,
      );
      expect(result).toBe(false);
    });

    it('should return false when company users is not an array', () => {
      const applicationWithInvalidUsers = {
        ...mockJobApplication,
        job: {
          ...mockJobApplication.job,
          company: { ...mockJobApplication.job!.company!, users: null as any },
        },
      };
      const result = service.isFromSameCompany(
        applicationWithInvalidUsers as JobApplication,
        mockRecruiterActor,
      );
      expect(result).toBe(false);
    });

    it('should return true for admin recruiter even when company has no users', () => {
      const applicationWithoutUsers = {
        ...mockJobApplication,
        job: {
          ...mockJobApplication.job,
          company: { ...mockJobApplication.job!.company!, users: [] },
        },
      };
      const result = service.isFromSameCompany(
        applicationWithoutUsers as JobApplication,
        mockAdminRecruiterActor,
      );
      expect(result).toBe(true);
    });
  });
});
