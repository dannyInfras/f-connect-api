import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, FindOneOptions, Repository } from 'typeorm';

import { CandidateProfile } from '@/modules/candidate-profile/entities/candidate-profile.entity';
import { Job } from '@/modules/jobs/entities/jobs.entity';
import { User } from '@/modules/user/entities/user.entity';
import { UnitOfWork } from '@/shared/unit-of-work/unit-of-work.service';

import { Company } from '../../company/entities/company.entity';
import { JobApplicationResponseDto } from '../dtos/job-appication-response.dto';
import { JobApplication } from '../entities/job-application.entity';
import { ApplicationStatus } from '../enums/application-status.enum';
import {
  ApplicationDetailResponse,
  ApplicationWithFullCompanyProfile,
  ApplicationWithFullRelations,
  ApplicationWithRelations,
  CandidateApplicationDetailResponse,
  CandidateProfileRaw,
  CreateApplicationData,
  EmailNotificationData,
  FindByJobIdParams,
  FindByUserIdParams,
  GetApplicationDetailParams,
  GetApplicationWithCompanyProfileParams,
  GetCandidateProfileParams,
  ServiceApplicationsWithCount,
} from '../types';

export interface FindAllApplicationsParams {
  companyId?: number;
  limit: number;
  offset: number;
}

@Injectable()
export class JobApplicationRepository {
  private readonly logger = new Logger(JobApplicationRepository.name);

  constructor(
    @InjectRepository(JobApplication)
    private readonly repo: Repository<JobApplication>,
    private readonly unitOfWork: UnitOfWork,
    private readonly dataSource: DataSource,
  ) {}

  async save(application: JobApplication): Promise<JobApplication> {
    return this.repo.save(application);
  }

  async findOne(
    options: FindOneOptions<JobApplication>,
  ): Promise<JobApplication | null> {
    return this.repo.findOne(options);
  }

  async createApplicationEntity(
    params: CreateApplicationData,
  ): Promise<JobApplication> {
    const application = new JobApplication();
    application.user = { id: params.userId } as User;
    application.job = { id: String(params.jobId) } as Job;
    application.cv_id = params.cvId || '';
    application.cover_letter = params.coverLetter || '';
    application.status = ApplicationStatus.APPLIED;
    // Set AI status based on whether cvId is provided and is a URL
    application.ai_status =
      params.cvId && params.cvId.startsWith('http')
        ? 'PENDING_SCORE'
        : 'PENDING';
    return application;
  }

  async createApplication(
    params: CreateApplicationData,
  ): Promise<JobApplication> {
    return this.unitOfWork.doTransactional(async (manager: EntityManager) => {
      const applicationRepo = manager.getRepository(JobApplication);
      const application = await this.createApplicationEntity(params);
      const savedApplication = await applicationRepo.save(application);
      return savedApplication;
    });
  }

  async findByUserId(
    params: FindByUserIdParams,
  ): Promise<ServiceApplicationsWithCount> {
    const { userId, limit, offset } = params;

    const query = this.repo
      .createQueryBuilder('application')
      .leftJoinAndSelect('application.user', 'user')
      .leftJoinAndSelect('application.job', 'job')
      .leftJoinAndSelect('job.company', 'company')
      .where('application.user_id = :userId', { userId });

    const [applications, count] = await Promise.all([
      query.take(limit).skip(offset).getMany(),
      query.getCount(),
    ]);

    return {
      applications: applications.map((application) =>
        this.mapToJobApplicationResponseDto(application),
      ),
      count,
    };
  }

  async findByJobId(
    params: FindByJobIdParams,
  ): Promise<ServiceApplicationsWithCount> {
    const { jobId, limit, offset } = params;

    const query = this.repo
      .createQueryBuilder('application')
      .leftJoinAndSelect('application.user', 'user')
      .leftJoinAndSelect('application.job', 'job')
      .leftJoinAndSelect('job.company', 'company')
      .where({ job: { id: String(jobId) } });

    const [applications, count] = await Promise.all([
      query.take(limit).skip(offset).getMany(),
      query.getCount(),
    ]);

    return {
      applications: applications.map((application) =>
        this.mapToJobApplicationResponseDto(application),
      ),
      count,
    };
  }

  async findApplicationWithFullDetails(
    params: GetApplicationDetailParams,
  ): Promise<ApplicationWithFullRelations | null> {
    const application = await this.repo
      .createQueryBuilder('application')
      .leftJoinAndSelect('application.user', 'user')
      .leftJoinAndSelect('application.job', 'job')
      .leftJoinAndSelect('job.company', 'company')
      .leftJoinAndSelect('company.users', 'companyUsers')
      .where('application.id = :applicationId', {
        applicationId: params.applicationId,
      })
      .getOne();

    if (!application) {
      return null;
    }

    return this.mapToApplicationWithFullRelations(application);
  }

  async findCandidateProfile(
    params: GetCandidateProfileParams,
  ): Promise<CandidateProfileRaw | null> {
    try {
      const candidateProfile = await this.dataSource
        .getRepository(CandidateProfile)
        .createQueryBuilder('cp')
        .leftJoinAndSelect('cp.experiences', 'experiences')
        .leftJoinAndSelect('cp.educations', 'educations')
        .where('cp.user.id = :userId', { userId: params.userId })
        .getOne();

      if (!candidateProfile) {
        return null;
      }

      return this.mapToCandidateProfileRaw(candidateProfile);
    } catch (error) {
      this.logger.error(
        `Error fetching candidate profile for userId ${params.userId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      return null;
    }
  }

  async updateApplication(
    applicationId: number,
    updateData: Partial<JobApplication>,
  ): Promise<JobApplication> {
    return this.unitOfWork.doTransactional(async (manager: EntityManager) => {
      const applicationRepo = manager.getRepository(JobApplication);

      await applicationRepo.update(applicationId, updateData);

      const updatedApplication = await applicationRepo.findOne({
        where: { id: applicationId },
        relations: ['user', 'job', 'job.company'],
      });

      if (!updatedApplication) {
        throw new Error('Application not found after update');
      }

      return updatedApplication;
    });
  }

  async findApplicationWithRelations(
    applicationId: number,
  ): Promise<ApplicationWithRelations | null> {
    const application = await this.repo.findOne({
      where: { id: applicationId },
      relations: ['user', 'job', 'job.company'],
    });

    return application as ApplicationWithRelations | null;
  }

  mapToApplicationDetailResponse(
    application: ApplicationWithFullRelations,
    candidateProfile: CandidateProfileRaw | null,
  ): ApplicationDetailResponse {
    return {
      id: application.id,
      status: application.status,
      cv_id: application.cv_id,
      cover_letter: application.cover_letter,
      applied_at: application.applied_at,
      updated_at: application.updated_at,
      ai_status: application.ai_status,
      ai_score: application.ai_score,
      ai_analysis: application.ai_analysis,
      candidate: {
        id: application.user.id,
        name: application.user.name,
        email: application.user.email,
        phone: application.user.phone,
        avatar: application.user.avatar,
        gender: application.user.gender,
      },
      candidateProfile: candidateProfile,
      job: {
        id: application.job.id,
        title: application.job.title,
        location: application.job.location,
        typeOfEmployment: application.job.typeOfEmployment,
        company: {
          id: application.job.company.id,
          companyName: application.job.company.companyName,
          logoUrl: application.job.company.logoUrl,
        },
      },
    };
  }

  mapToEmailNotificationData(
    application: ApplicationWithRelations,
  ): EmailNotificationData {
    return {
      to: application.user.email,
      applicantName: application.user.name,
      jobTitle: application.job.title,
      companyName: application.job.company.companyName,
      appliedDate: application.applied_at.toISOString(),
      cvSubmitted: !!application.cv_id,
      cvFileUrl: application.cv_id,
    };
  }

  private mapToJobApplicationResponseDto(
    application: JobApplication,
  ): JobApplicationResponseDto {
    return {
      id: application.id.toString(),
      status: application.status,
      cv_id: application.cv_id,
      cover_letter: application.cover_letter,
      applied_at: application.applied_at,
      updated_at: application.updated_at,
      ai_score: application.ai_score || undefined,
      ai_analysis: application.ai_analysis || undefined,
      ai_status: application.ai_status || 'PENDING',
      user: {
        id: application.user.id,
        name: application.user.name,
        email: application.user.email,
        phone: application.user.phone,
        avatar: application.user.avatar,
        gender: application.user.gender,
      } as User,
      job: {
        id: application.job.id,
        title: application.job.title,
        location: application.job.location,
        typeOfEmployment: application.job.typeOfEmployment,
        salaryMin: application.job.salaryMin,
        salaryMax: application.job.salaryMax,
        description: application.job.description,
        category: application.job.category,
        createdAt: application.job.createdAt,
        updatedAt: application.job.updatedAt,
      } as Job,
      company: {
        id: application.job.company.id,
        companyName: application.job.company.companyName,
        logoUrl: application.job.company.logoUrl,
        website: application.job.company.website,
        phone: application.job.company.phone,
        email: application.job.company.email,
        description: application.job.company.description,
        address: application.job.company.address,
      } as Company,
    };
  }

  private mapToApplicationWithFullRelations(
    application: JobApplication,
  ): ApplicationWithFullRelations {
    return {
      id: application.id,
      status: application.status,
      cv_id: application.cv_id,
      cover_letter: application.cover_letter,
      applied_at: application.applied_at,
      updated_at: application.updated_at,
      ai_status: application.ai_status,
      ai_score: application.ai_score,
      ai_analysis: application.ai_analysis,
      user: {
        id: application.user.id,
        name: application.user.name,
        email: application.user.email,
        phone: application.user.phone,
        avatar: application.user.avatar,
        gender: application.user.gender,
      },
      job: {
        id: application.job.id,
        title: application.job.title,
        location: application.job.location,
        typeOfEmployment: application.job.typeOfEmployment,
        company: {
          id: application.job.company.id,
          companyName: application.job.company.companyName,
          logoUrl: application.job.company.logoUrl,
          users:
            application.job.company.users?.map((user) => ({
              id: user.id,
              email: user.email,
              roles: user.roles as any[], // Cast to any[] to fix type error
              companyId: user.company?.id || null,
            })) || [],
        },
      },
    };
  }

  private mapToCandidateProfileRaw(candidateProfile: any): CandidateProfileRaw {
    return {
      id: candidateProfile.id,
      title: candidateProfile.title,
      company: candidateProfile.company,
      location: candidateProfile.location,
      avatar: candidateProfile.avatar,
      coverImage: candidateProfile.coverImage,
      isOpenToOpportunities: candidateProfile.isOpenToOpportunities,
      about: candidateProfile.about,
      contact: candidateProfile.contact,
      social: candidateProfile.social,
      birthDate: candidateProfile.birthDate,
      experiences: candidateProfile.experiences || [],
      educations: candidateProfile.educations || [],
    };
  }

  /**
   * Find all applications for HR view
   */
  async findAllApplications(
    params: FindAllApplicationsParams,
  ): Promise<{ applications: any[]; count: number }> {
    const { companyId, limit, offset } = params;

    // Ensure limit and offset are safe values
    const safeLimit = Math.max(1, limit);
    const safeOffset = Math.max(0, offset);

    // Create query builder with necessary relations and fields
    const queryBuilder = this.repo
      .createQueryBuilder('application')
      .leftJoinAndSelect('application.user', 'user')
      .leftJoinAndSelect('application.job', 'job')
      .leftJoinAndSelect('job.company', 'company')
      .select([
        'application.id',
        'application.status',
        'application.applied_at',
        'application.ai_score',
        'application.ai_analysis',
        'application.ai_status',
        'user.id',
        'user.name',
        'user.avatar',
        'job.id',
        'job.title',
        'company.id',
        'company.companyName',
        'company.logoUrl',
      ]);

    // Filter by company if provided
    if (companyId) {
      queryBuilder.andWhere('company.id = :companyId', { companyId });
    }

    // Sort by most recent applications first
    queryBuilder.orderBy('application.applied_at', 'DESC');

    // Get total count before pagination
    const count = await queryBuilder.getCount();

    // Apply pagination
    queryBuilder.skip(safeOffset).take(safeLimit);

    // Execute query
    const applications = await queryBuilder.getMany();

    return { applications, count };
  }

  // Separate methods for candidate application view with full company profile
  async findApplicationWithCompanyProfile(
    params: GetApplicationWithCompanyProfileParams,
  ): Promise<ApplicationWithFullCompanyProfile | null> {
    const application = await this.repo
      .createQueryBuilder('application')
      .leftJoinAndSelect('application.user', 'user')
      .leftJoinAndSelect('application.job', 'job')
      .leftJoinAndSelect('job.company', 'company')
      .leftJoinAndSelect('company.users', 'companyUsers')
      .select([
        'application',
        'user.id',
        'user.name',
        'user.email',
        'user.phone',
        'user.avatar',
        'user.gender',
        'job.id',
        'job.title',
        'job.location',
        'job.typeOfEmployment',
        'job.salaryMin',
        'job.salaryMax',
        'job.description',
        'company.id',
        'company.companyName',
        'company.logoUrl',
        'company.website',
        'company.phone',
        'company.email',
        'company.description',
        'company.address',
        'companyUsers.id',
        'companyUsers.email',
        'companyUsers.roles',
        'companyUsers.companyId',
      ])
      .where('application.id = :applicationId', {
        applicationId: params.applicationId,
      })
      .getOne();

    if (!application) {
      return null;
    }

    return this.mapToApplicationWithCompanyProfile(application);
  }

  mapToCandidateApplicationDetailResponse(
    application: ApplicationWithFullCompanyProfile,
  ): CandidateApplicationDetailResponse {
    return {
      id: application.id,
      status: application.status,
      cv_id: application.cv_id,
      cover_letter: application.cover_letter,
      applied_at: application.applied_at,
      updated_at: application.updated_at,
      job: {
        id: application.job.id,
        title: application.job.title,
        location: application.job.location,
        typeOfEmployment: application.job.typeOfEmployment,
        salaryMin: application.job.salaryMin,
        salaryMax: application.job.salaryMax,
        description: application.job.description,
      },
      company: {
        id: application.job.company.id,
        name: application.job.company.companyName,
        logoUrl: application.job.company.logoUrl,
        website: application.job.company.website,
        phone: application.job.company.phone,
        email: application.job.company.email,
        about: application.job.company.description,
        contact: application.job.company.address,
      },
    };
  }

  private mapToApplicationWithCompanyProfile(
    application: JobApplication,
  ): ApplicationWithFullCompanyProfile {
    return {
      id: application.id,
      status: application.status,
      cv_id: application.cv_id,
      cover_letter: application.cover_letter,
      applied_at: application.applied_at,
      updated_at: application.updated_at,
      user: {
        id: application.user.id,
        name: application.user.name,
        email: application.user.email,
        phone: application.user.phone,
        avatar: application.user.avatar,
        gender: application.user.gender,
      },
      job: {
        id: application.job.id,
        title: application.job.title,
        location: application.job.location,
        typeOfEmployment: application.job.typeOfEmployment,
        salaryMin: application.job.salaryMin,
        salaryMax: application.job.salaryMax,
        description: application.job.description,
        company: {
          id: application.job.company.id,
          companyName: application.job.company.companyName,
          logoUrl: application.job.company.logoUrl,
          website: application.job.company.website,
          phone: application.job.company.phone,
          email: application.job.company.email,
          description: application.job.company.description,
          address: application.job.company.address,
          users:
            application.job.company.users?.map((user) => ({
              id: user.id,
              email: user.email,
              roles: user.roles as any[], // Cast to any[] to fix type error
              companyId: user.company?.id || null,
            })) || [],
        },
      },
    };
  }
}
