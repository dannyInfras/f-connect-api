import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { UnitOfWork } from '@/shared/unit-of-work/unit-of-work.service';

import { Action } from '../../../shared/acl/action.constant';
import { Job } from '../../jobs/entities/jobs.entity';
import { User } from '../../user/entities/user.entity';
import { JobApplicationAclService } from '../acl/job-application-acl.service';
import { JobApplication } from '../entities/job-application.entity';
import { ApplicationStatus } from '../enums/application-status.enum';
import { JobApplicationRepository } from '../repositories/job-application.repository';
import {
  ApplicationsWithCount,
  ApplicationWithRelations,
  CreateApplicationParams,
  EmailNotificationData,
  GetJobApplicationsParams,
  GetUserApplicationsParams,
  StatusTransitionParams,
  UpdateApplicationParams,
} from '../types';
import { JobApplicationNotificationService } from './job-application-notification.service';

@Injectable()
export class JobApplicationService {
  constructor(
    private readonly jobApplicationRepository: JobApplicationRepository,
    private readonly aclService: JobApplicationAclService,
    private readonly notificationService: JobApplicationNotificationService,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async createApplication(
    params: CreateApplicationParams,
  ): Promise<JobApplication> {
    const { dto, user } = params;

    try {
      // Check if user has already applied for this job
      const existingApplication = await this.jobApplicationRepository.findOne({
        where: {
          job: { id: String(dto.jobId) },
          user: { id: user.id },
        },
      });

      if (existingApplication) {
        throw new BadRequestException('You have already applied for this job');
      }

      const application = this.createApplicationEntity({
        jobId: dto.jobId,
        userId: user.id,
        cvId: dto.cvId,
        coverLetter: dto.coverLetter,
      });

      if (!this.aclService.forActor(user).canDoAction('create', application)) {
        throw new UnauthorizedException(
          'You are not authorized to apply for this job',
        );
      }

      const savedApplication = await this.unitOfWork.doTransactional(
        async (manager) => {
          const jobApplicationRepo = manager.getRepository(JobApplication);
          return await jobApplicationRepo.save(application);
        },
      );

      // Load the full application with relations for email notification
      const applicationWithRelations = await this.getApplicationWithRelations(
        savedApplication.id,
      );

      if (applicationWithRelations) {
        const emailData = this.prepareEmailNotificationData(
          applicationWithRelations,
        );
        await this.notificationService.sendApplicationSuccessEmail(emailData);
      }

      return savedApplication;
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        'Failed to create job application. Please try again.',
      );
    }
  }

  async getUserApplications(
    params: GetUserApplicationsParams,
  ): Promise<ApplicationsWithCount> {
    const { user, limit, offset } = params;

    try {
      const { applications, count } =
        await this.jobApplicationRepository.findByUserId({
          userId: user.id,
          limit,
          offset,
        });

      return {
        applications: applications.filter((app) =>
          this.aclService.forActor(user).canDoAction(Action.List, app),
        ),
        count,
      };
    } catch (error) {
      throw new BadRequestException('Failed to fetch user applications');
    }
  }

  async getJobApplications(
    params: GetJobApplicationsParams,
  ): Promise<ApplicationsWithCount> {
    const { jobId, user, limit, offset } = params;

    try {
      const { applications, count } =
        await this.jobApplicationRepository.findByJobId({
          jobId,
          limit,
          offset,
        });

      return {
        applications: applications.filter((app) =>
          this.aclService.forActor(user).canDoAction('read', app),
        ),
        count,
      };
    } catch (error) {
      throw new BadRequestException('Failed to fetch job applications');
    }
  }

  async updateApplication(
    params: UpdateApplicationParams,
  ): Promise<JobApplication> {
    const { id, dto, user } = params;

    try {
      const application = await this.jobApplicationRepository.findOne({
        where: { id },
      });

      if (!application) {
        throw new NotFoundException('Application not found');
      }

      if (!this.aclService.forActor(user).canDoAction('update', application)) {
        throw new UnauthorizedException(
          'You are not authorized to update this application',
        );
      }

      // Validate status transition
      if (dto.status) {
        this.validateStatusTransition({
          currentStatus: application.status,
          newStatus: dto.status,
        });
        application.status = dto.status;
      }

      return await this.jobApplicationRepository.save(application);
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to update job application');
    }
  }

  private createApplicationEntity(params: {
    jobId: number;
    userId: number;
    cvId?: string;
    coverLetter?: string;
  }): JobApplication {
    const { jobId, userId, cvId, coverLetter } = params;

    const application = new JobApplication();
    application.job = { id: String(jobId) } as Job;
    application.user = { id: userId } as User;
    application.status = ApplicationStatus.APPLIED;

    if (cvId) {
      application.cv_id = cvId;
    }
    if (coverLetter) {
      application.cover_letter = coverLetter;
    }

    return application;
  }

  private async getApplicationWithRelations(
    applicationId: number,
  ): Promise<ApplicationWithRelations | null> {
    const application = await this.jobApplicationRepository.findOne({
      where: { id: applicationId },
      relations: ['user', 'job', 'job.company'],
    });

    return application as ApplicationWithRelations | null;
  }

  private prepareEmailNotificationData(
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

  private validateStatusTransition(params: StatusTransitionParams): void {
    const { currentStatus, newStatus } = params;

    const validTransitions: Record<ApplicationStatus, ApplicationStatus[]> = {
      [ApplicationStatus.APPLIED]: [
        ApplicationStatus.INTERVIEW,
        ApplicationStatus.REJECTED,
      ],
      [ApplicationStatus.INTERVIEW]: [
        ApplicationStatus.HIRED,
        ApplicationStatus.REJECTED,
      ],
      [ApplicationStatus.HIRED]: [],
      [ApplicationStatus.REJECTED]: [],
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${currentStatus} to ${newStatus}`,
      );
    }
  }
}
