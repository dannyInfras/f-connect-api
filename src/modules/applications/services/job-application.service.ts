import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { ROLE } from '@/modules/auth/constants/role.constant';
import { EventType } from '@/modules/schedule/enums/event-type.enum';
import { ParticipantRole } from '@/modules/schedule/enums/participant-role.enum';
import { ScheduleService } from '@/modules/schedule/services/schedule.service';
import { UserService } from '@/modules/user/services/user.service';
import { Action } from '@/shared/acl/action.constant';
import { AppEvents } from '@/shared/events/event.constants';
import { EventEmitterService } from '@/shared/events/event-emitter.service';
import { AppLogger } from '@/shared/logger/logger.service';
import { RequestContext } from '@/shared/request-context/request-context.dto';
import { UnitOfWork } from '@/shared/unit-of-work/unit-of-work.service';

import { UserAccessTokenClaims } from '../../auth/dtos/auth-token-output.dto';
import { JobApplicationAclService } from '../acl/job-application-acl.service';
import { JobApplicationResponseDto } from '../dtos/job-appication-response.dto';
import { JobApplication } from '../entities/job-application.entity';
import { ApplicationStatus } from '../enums/application-status.enum';
import { JobApplicationRepository } from '../repositories/job-application.repository';
import {
  ApplicationDetailResponse,
  CandidateApplicationDetailResponse,
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
    private readonly userService: UserService,
    private readonly eventEmitter: EventEmitterService,
    private readonly scheduleService: ScheduleService,
  ) {
    this.logger.setContext(JobApplicationService.name);
  }

  /**
   * Create an interview schedule for a given application (HR or Admin only)
   */
  async scheduleInterviewForApplication(params: {
    applicationId: number;
    title?: string;
    startsAt: string;
    endsAt: string;
    location?: string;
    notes?: string;
    interviewerIds: number[];
    user: UserAccessTokenClaims;
  }) {
    const {
      applicationId,
      title,
      startsAt,
      endsAt,
      location,
      notes,
      interviewerIds,
      user,
    } = params;
    const application = await this.jobApplicationRepository.findOne({
      where: { id: applicationId },
      relations: ['user', 'job', 'job.company'],
    });
    if (!application) {
      throw new NotFoundException('Application not found');
    }

    // ACL: ensure HR/admin can update application
    if (
      !this.aclService.forActor(user).canDoAction(Action.Update, application)
    ) {
      throw new UnauthorizedException(
        'You are not authorized to schedule an interview for this application',
      );
    }

    const companyId = application.job.company.id.toString();
    const eventTitle =
      title || `Interview: ${application.job.title} - ${application.user.name}`;

    // Build participants: Candidate + Host (creator) + Interviewers
    const participants = [
      { userId: application.user.id, role: ParticipantRole.CANDIDATE },
      { userId: user.id, role: ParticipantRole.HOST },
      ...interviewerIds.map((id) => ({
        userId: id,
        role: ParticipantRole.INTERVIEWER,
      })),
    ];

    const event = await this.scheduleService.createEvent(
      {
        companyId,
        createdBy: user.id,
        title: eventTitle,
        type: EventType.INTERVIEW,
        startsAt: new Date(startsAt),
        endsAt: new Date(endsAt),
        location,
        notes,
        applicationId,
        participants,
      },
      user,
    );

    // Best-effort: update status to INTERVIEW if allowed
    try {
      if (application.status !== ApplicationStatus.INTERVIEW) {
        await this.updateApplication({
          id: applicationId,
          dto: { status: ApplicationStatus.INTERVIEW },
          user,
        });
      }
    } catch {
      // TODO: consider logging but do not block schedule creation
    }

    return event;
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

      // Notify company users about the new application
      try {
        const applicationWithFullDetails =
          await this.jobApplicationRepository.findApplicationWithFullDetails({
            applicationId: result.id,
          });

        if (applicationWithFullDetails) {
          await this.notificationService.notifyCompanyAboutNewApplication(
            applicationWithFullDetails,
            result.id,
          );
        }
      } catch (error: any) {
        this.logger.error(
          { requestID: 'internal', url: 'internal', ip: '0.0.0.0', user: null },
          `Failed to notify company about new application ${result.id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
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

  async getJobApplicationsSimplified(params: GetJobApplicationsServiceParams) {
    const { jobId, user, limit, offset } = params;

    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { applications, count } =
        await this.jobApplicationRepository.findByJobId({
          jobId,
          limit,
          offset,
        });

      // Filter applications based on ACL permissions
      const filteredApplications = applications.filter(
        (app: JobApplicationResponseDto) =>
          this.aclService.forActor(user).canDoAction('read', app),
      );

      // Map to simplified format
      const simplifiedApplications = filteredApplications.map((app) => {
        // Format the date as YYYY-MM-DD
        const formattedDate = new Date(app.applied_at)
          .toISOString()
          .split('T')[0];

        return {
          id: app.id,
          applicantName: app.user.name,
          applicationStatus: app.status.toString(),
          appliedDate: formattedDate,
          ai_score: app.ai_score || undefined,
          ai_analysis: app.ai_analysis || undefined,
          ai_status: app.ai_status || 'PENDING',
          isRead: (app as any).isRead ?? (app as any).is_read ?? false,
        };
      });

      return {
        applications: simplifiedApplications,
        meta: {
          count: filteredApplications.length,
        },
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

      const oldStatus = application.status;

      await this.jobApplicationRepository.updateApplication(id, {
        status: dto.status,
      });

      // Emit event if status actually changed
      if (dto.status && dto.status !== oldStatus) {
        this.eventEmitter.emit(AppEvents.APPLICATION_STATUS_CHANGED, {
          applicationId: application.id,
          userId: application.user.id,
          jobTitle: application.job.title,
          oldStatus,
          newStatus: dto.status,
          companyName: application.job.company.companyName || 'Company',
        });
      }

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

  async markAsRead(
    applicationId: number,
    user: UserAccessTokenClaims,
  ): Promise<UpdateApplicationServiceResponse> {
    const application = await this.jobApplicationRepository.findOne({
      where: { id: applicationId },
      relations: ['user', 'job', 'job.company', 'job.company.users'],
    });
    if (!application) {
      throw new NotFoundException('Application not found');
    }
    if (
      !this.aclService.forActor(user).canDoAction(Action.Update, application)
    ) {
      throw new UnauthorizedException(
        'You are not authorized to update this application',
      );
    }
    await this.jobApplicationRepository.updateApplication(applicationId, {
      isRead: true,
    } as any);
    return { message: 'Application marked as read', success: true };
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

  async getApplicationByIdForCandidate(
    applicationId: number,
    user: any,
  ): Promise<CandidateApplicationDetailResponse> {
    // Fetch application with full company profile using separate repository method
    const application =
      await this.jobApplicationRepository.findApplicationWithCompanyProfile({
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

    // Use repository mapping method to build response with company profile
    return this.jobApplicationRepository.mapToCandidateApplicationDetailResponse(
      application,
    );
  }

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

      // Find user's company ID from database instead of relying on JWT token
      const userCompanyId = await this.findCompanyIdByUserId(user.id);

      // Convert string companyId to number for database query
      const companyId = userCompanyId ? Number(userCompanyId) : null;

      // If user has no company association, return empty results
      // HR users should only see applications for their specific company
      if (companyId === null) {
        return { applications: [], count: 0 };
      }

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
        isRead: (app as any).isRead ?? (app as any).is_read ?? false,
        candidate: {
          id: app.user.id.toString(),
          name: app.user.name,
          avatar_url: app.user.avatar || undefined,
        },
        job: {
          id: app.job.id.toString(),
          title: app.job.title,
        },
        ai_score: app.ai_score || undefined,
        ai_analysis: app.ai_analysis || undefined,
        ai_status: app.ai_status || 'PENDING',
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

  private validateStatusTransition(params: StatusTransitionParams): void {
    const { currentStatus, newStatus } = params;

    if (currentStatus === newStatus) {
      return; // No transition needed, already at the target status
    }

    // Define allowed transitions for each status
    const allowedTransitions: Record<ApplicationStatus, ApplicationStatus[]> = {
      [ApplicationStatus.APPLIED]: [
        ApplicationStatus.IN_REVIEW,
        ApplicationStatus.IN_SHORTLIST,
        ApplicationStatus.REJECTED,
      ],
      [ApplicationStatus.IN_REVIEW]: [
        ApplicationStatus.IN_SHORTLIST,
        ApplicationStatus.REJECTED,
      ],
      [ApplicationStatus.IN_SHORTLIST]: [
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
   * Find user's company ID from database
   */
  private async findCompanyIdByUserId(userId: number): Promise<string | null> {
    const ctx = new RequestContext();
    ctx.user = { id: userId } as UserAccessTokenClaims;

    try {
      const user = await this.userService.findById(ctx, userId);
      return user.companyId || null;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        ctx,
        `Failed to find company for user ${userId}: ${errorMessage}`,
      );
      return null;
    }
  }
}
