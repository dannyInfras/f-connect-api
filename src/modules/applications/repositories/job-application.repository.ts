import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, FindOneOptions, Repository } from 'typeorm';

import { CandidateProfile } from '@/modules/candidate-profile/entities/candidate-profile.entity';
import { Job } from '@/modules/jobs/entities/jobs.entity';
import { User } from '@/modules/user/entities/user.entity';
import { UnitOfWork } from '@/shared/unit-of-work/unit-of-work.service';

import { JobApplicationResponseDto } from '../dtos/job-appication-response.dto';
import { JobApplication } from '../entities/job-application.entity';
import { ApplicationStatus } from '../enums/application-status.enum';
import {
  ApplicationDetailResponse,
  ApplicationWithFullRelations,
  ApplicationWithRelations,
  CandidateProfileRaw,
  CreateApplicationData,
  EmailNotificationData,
  FindByJobIdParams,
  FindByUserIdParams,
  GetApplicationDetailParams,
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
        company: application.job.company,
      } as Job,
      company: application.job.company,
      status: application.status,
      cv_id: application.cv_id,
      cover_letter: application.cover_letter,
      applied_at: application.applied_at,
      updated_at: application.updated_at,
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
}
