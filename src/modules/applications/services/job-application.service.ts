import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { ROLE } from '@/modules/auth/constants/role.constant';
import { Action } from '@/shared/acl/action.constant';
import { AppLogger } from '@/shared/logger/logger.service';
import { UnitOfWork } from '@/shared/unit-of-work/unit-of-work.service';

import { JobApplicationAclService } from '../acl/job-application-acl.service';
import { JobApplicationResponseDto } from '../dtos/job-appication-response.dto';
import { JobApplication } from '../entities/job-application.entity';
import { ApplicationStatus } from '../enums/application-status.enum';
import { JobApplicationRepository } from '../repositories/job-application.repository';
import {
  ApplicationDetailResponse,
  CreateApplicationServiceParams,
  GetHrApplicationsServiceParams,
  GetJobApplicationsServiceParams,
  GetUserApplicationsServiceParams,
  HrApplicationsWithCount,
  ServiceApplicationsWithCount as ApplicationsWithCount,
  ServiceCreateApplicationResponse,
  StatusTransitionParams,
  UpdateApplicationServiceParams,
  UpdateApplicationServiceResponse,
} from '../types';
import { JobApplicationNotificationService } from './job-application-notification.service';

@Injectable()
export class JobApplicationService {
  constructor(
    private readonly jobApplicationRepository: JobApplicationRepository,
    private readonly aclService: JobApplicationAclService,
    private readonly notificationService: JobApplicationNotificationService,
    private readonly unitOfWork: UnitOfWork,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(JobApplicationService.name);
  }

  async createApplication(
    params: CreateApplicationServiceParams,
  ): Promise<ServiceCreateApplicationResponse> {
    const { dto, user } = params;

    try {
      const result = await this.unitOfWork.doTransactional(
        async (entityManager) => {
          // Check if user has already applied for this job using transactional entity manager
          const applicationRepo = entityManager.getRepository(JobApplication);
          const existingApplication = await applicationRepo.findOne({
            where: {
              job: { id: String(dto.jobId) },
              user: { id: user.id },
            },
          });

          if (existingApplication) {
            throw new BadRequestException(
              'You have already applied for this job',
            );
          }

          // Create application entity using repository
          const applicationEntity =
            await this.jobApplicationRepository.createApplicationEntity({
              jobId: dto.jobId,
              userId: user.id,
              cvId: dto.cvId,
              coverLetter: dto.coverLetter,
            });

          if (
            !this.aclService
              .forActor(user)
              .canDoAction('create', applicationEntity)
          ) {
            throw new UnauthorizedException(
              'You are not authorized to apply for this job',
            );
          }

          // Save using transactional entity manager
          const savedApplication = await entityManager.save(applicationEntity);

          return {
            id: savedApplication.id,
            status: savedApplication.status,
            applied_at: savedApplication.applied_at,
          };
        },
      );

      // Send email notification outside the transaction to prevent rollback on email failure
      try {
        const applicationWithRelations =
          await this.jobApplicationRepository.findApplicationWithRelations(
            result.id,
          );

        if (applicationWithRelations) {
          const emailData =
            this.jobApplicationRepository.mapToEmailNotificationData(
              applicationWithRelations,
            );
          await this.notificationService.sendApplicationSuccessEmail(emailData);
        }
      } catch (error: any) {
        this.logger.error(error, 'Failed to send email');
      }

      return result;
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
    params: GetUserApplicationsServiceParams,
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
        applications: applications.filter((app: JobApplicationResponseDto) =>
          this.aclService.forActor(user).canDoAction(Action.List, app),
        ),
        count,
      };
    } catch (error) {
      throw new BadRequestException('Failed to fetch user applications');
    }
  }

  async getJobApplications(
    params: GetJobApplicationsServiceParams,
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
        applications: applications.filter((app: JobApplicationResponseDto) =>
          this.aclService.forActor(user).canDoAction('read', app),
        ),
        count,
      };
    } catch (error) {
      throw new BadRequestException('Failed to fetch job applications');
    }
  }

  async updateApplication(
    params: UpdateApplicationServiceParams,
  ): Promise<UpdateApplicationServiceResponse> {
    const { id, dto, user } = params;

    try {
      const application = await this.jobApplicationRepository.findOne({
        where: { id },
        relations: ['user', 'job', 'job.company', 'job.company.users'],
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
      }

      await this.jobApplicationRepository.updateApplication(id, {
        status: dto.status,
      });

      return {
        message: 'Application status updated successfully',
        success: true,
      };
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

  async getApplicationById(
    applicationId: number,
    user: any,
  ): Promise<ApplicationDetailResponse> {
    // Fetch application with all required relations using repository
    const application =
      await this.jobApplicationRepository.findApplicationWithFullDetails({
        applicationId,
      });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    // Check ACL permissions - convert to JobApplication-like object for ACL check
    const aclCheckObject = {
      id: application.id,
      user: { id: application.user.id },
      job: {
        id: application.job.id,
        company: {
          id: application.job.company.id,
          users:
            application.job.company.users?.map((u) => ({ id: u.id })) || [],
        },
      },
    } as any;

    if (
      !this.aclService.forActor(user).canDoAction(Action.Read, aclCheckObject)
    ) {
      throw new UnauthorizedException(
        'You do not have permission to view this application',
      );
    }

    // Fetch candidate profile separately
    const candidateProfile =
      await this.jobApplicationRepository.findCandidateProfile({
        userId: application.user.id,
      });

    // Use repository mapping method to build response
    return this.jobApplicationRepository.mapToApplicationDetailResponse(
      application,
      candidateProfile,
    );
  }

  private validateStatusTransition(params: StatusTransitionParams): void {
    const { currentStatus, newStatus } = params;

    if (currentStatus === newStatus) {
      return; // No transition needed, already at the target status
    }

    // Define allowed transitions for each status
    const allowedTransitions: Record<ApplicationStatus, ApplicationStatus[]> = {
      [ApplicationStatus.APPLIED]: [
        ApplicationStatus.INTERVIEW,
        ApplicationStatus.HIRED,
        ApplicationStatus.REJECTED,
      ],
      [ApplicationStatus.INTERVIEW]: [
        ApplicationStatus.HIRED,
        ApplicationStatus.REJECTED,
      ],
      [ApplicationStatus.HIRED]: [],
      [ApplicationStatus.REJECTED]: [],
    };

    if (
      !allowedTransitions[currentStatus] ||
      !allowedTransitions[currentStatus].includes(newStatus)
    ) {
      throw new BadRequestException(
        `Cannot transition from ${currentStatus} to ${newStatus}`,
      );
    }
  }

  /**
   * Get all applications for HR view with pagination
   */
  async getHrApplications(
    params: GetHrApplicationsServiceParams,
  ): Promise<HrApplicationsWithCount> {
    const { user, limit, offset } = params;

    try {
      // Verify user has HR or admin access
      const isHrPersonnel =
        user.roles &&
        (user.roles.includes(ROLE.ADMIN) ||
          user.roles.includes(ROLE.ADMIN_RECRUITER) ||
          user.roles.includes(ROLE.RECRUITER));

      if (!isHrPersonnel) {
        throw new UnauthorizedException(
          'Only HR personnel can access this resource',
        );
      }

      // Get applications using repository with company filtering if applicable
      const companyId =
        typeof user.companyId === 'string' ? Number(user.companyId) : undefined;
      const { applications: rawApplications, count } =
        await this.jobApplicationRepository.findAllApplications({
          companyId,
          limit,
          offset,
        });

      // Map raw applications to DTO format
      const applications = rawApplications.map((app) => ({
        id: app.id.toString(),
        status: app.status,
        applied_at: app.applied_at,
        candidate: {
          id: app.user.id.toString(),
          name: app.user.name,
          avatar_url: app.user.avatar || undefined,
        },
        job: {
          id: app.job.id.toString(),
          title: app.job.title,
        },
      }));

      return { applications, count };
    } catch (error: unknown) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      console.error(
        `Failed to fetch HR applications: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw new BadRequestException('Failed to fetch applications');
    }
  }
}
