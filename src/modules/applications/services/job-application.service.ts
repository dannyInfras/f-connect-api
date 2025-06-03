import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { UserAccessTokenClaims } from '../../auth/dtos/auth-token-output.dto';
import { JobApplicationAclService } from '../acl/job-application-acl.service';
import { CreateJobApplicationDto } from '../dtos/create-job-application.dto';
import { UpdateJobApplicationDto } from '../dtos/update-job-application.dto';
import { JobApplication } from '../entities/job-application.entity';
import { ApplicationStatus } from '../enums/application-status.enum';
import { JobApplicationRepository } from '../repositories/job-application.repository';

@Injectable()
export class JobApplicationService {
  constructor(
    private readonly jobApplicationRepository: JobApplicationRepository,
    private readonly aclService: JobApplicationAclService,
  ) {}

  async createApplication(
    dto: CreateJobApplicationDto,
    user: UserAccessTokenClaims,
  ): Promise<JobApplication> {
    try {
      // Check if user has already applied for this job
      const existingApplication = await this.jobApplicationRepository.findOne({
        where: {
          job: { id: dto.jobId },
          user: { id: user.id },
        },
      });

      if (existingApplication) {
        throw new BadRequestException('You have already applied for this job');
      }

      const application = new JobApplication();
      application.job = { id: dto.jobId } as any;
      application.user = { id: user.id } as any;
      application.status = ApplicationStatus.APPLIED; // Set initial status

      if (dto.cvId) {
        application.cv_id = dto.cvId;
      }
      if (dto.coverLetter) {
        application.cover_letter = dto.coverLetter;
      }

      if (!this.aclService.forActor(user).canDoAction('create', application)) {
        throw new UnauthorizedException(
          'You are not authorized to apply for this job',
        );
      }

      return await this.jobApplicationRepository.save(application);
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
    user: UserAccessTokenClaims,
  ): Promise<JobApplication[]> {
    try {
      const applications = await this.jobApplicationRepository.findByUserId(
        user.id,
      );
      return applications.filter((app) =>
        this.aclService.forActor(user).canDoAction('read', app),
      );
    } catch (error) {
      throw new BadRequestException('Failed to fetch user applications');
    }
  }

  async getJobApplications(
    jobId: number,
    user: UserAccessTokenClaims,
  ): Promise<JobApplication[]> {
    try {
      const applications =
        await this.jobApplicationRepository.findByJobId(jobId);
      return applications.filter((app) =>
        this.aclService.forActor(user).canDoAction('read', app),
      );
    } catch (error) {
      throw new BadRequestException('Failed to fetch job applications');
    }
  }

  async updateApplication(
    id: number,
    dto: UpdateJobApplicationDto,
    user: UserAccessTokenClaims,
  ): Promise<JobApplication> {
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
        this.validateStatusTransition(application.status, dto.status);
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

  private validateStatusTransition(
    currentStatus: ApplicationStatus,
    newStatus: ApplicationStatus,
  ): void {
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
