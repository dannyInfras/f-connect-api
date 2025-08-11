import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { ROLE } from '@/modules/auth/constants/role.constant';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { EventStatus } from '@/modules/schedule/enums/event-status.enum';
import { EventType } from '@/modules/schedule/enums/event-type.enum';
import { ScheduleService } from '@/modules/schedule/services/schedule.service';
import { ReqContext } from '@/shared/request-context/req-context.decorator';
import { RequestContext } from '@/shared/request-context/request-context.dto';

import {
  ApplicationDetailResponseDto,
  CandidateApplicationDetailResponseDto,
} from '../dtos/application-detail-response.dto';
import { CreateJobApplicationDto } from '../dtos/create-job-application.dto';
import { HrApplicationsResponseDto } from '../dtos/hr-applications-response.dto';
import { JobApplicationResponseDto } from '../dtos/job-appication-response.dto';
import { JobApplicationsSimplifiedResponseDto } from '../dtos/job-applications-simplified-response.dto';
import { UpdateJobApplicationDto } from '../dtos/update-job-application.dto';
import { UpdateJobApplicationResponseDto } from '../dtos/update-job-application-response.dto';
import { JobApplicationService } from '../services/job-application.service';
import {
  GetApplicationsResponse,
  GetHrApplicationsResponse,
  UpdateApplicationResponse,
} from '../types';

@ApiTags('job-applications')
@Controller('applications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class JobApplicationController {
  constructor(
    private readonly jobApplicationService: JobApplicationService,
    private readonly scheduleService: ScheduleService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Apply for a job' })
  @ApiOkResponse({ type: JobApplicationResponseDto })
  async create(
    @Body() createJobApplicationDto: CreateJobApplicationDto,
    @ReqContext() ctx: RequestContext,
  ) {
    const result = await this.jobApplicationService.createApplication({
      dto: createJobApplicationDto,
      user: ctx.user!,
    });

    return {
      data: {
        id: result.id.toString(),
        status: result.status,
        applied_at: result.applied_at,
      },
      meta: {
        message: 'Application created successfully',
      },
    };
  }

  @Get('user')
  @ApiOperation({ summary: 'Get current user applications' })
  @ApiOkResponse({ type: JobApplicationResponseDto, isArray: true })
  async getUserApplications(
    @Query('limit') limit: string | undefined,
    @Query('offset') offset: string | undefined,
    @ReqContext() ctx: RequestContext,
  ): Promise<GetApplicationsResponse> {
    const parsedLimit = limit ? Number(limit) : 10;
    const parsedOffset = offset ? Number(offset) : 0;

    // Validate that parsed values are valid numbers
    const validLimit = isNaN(parsedLimit) ? 10 : Math.max(1, parsedLimit);
    const validOffset = isNaN(parsedOffset) ? 0 : Math.max(0, parsedOffset);

    const result = await this.jobApplicationService.getUserApplications({
      user: ctx.user!,
      limit: validLimit,
      offset: validOffset,
    });

    return {
      data: result.applications,
      meta: {
        count: result.count,
      },
    };
  }

  @Get('job/:jobId')
  @ApiOperation({ summary: 'Get applications for a specific job' })
  @ApiOkResponse({
    type: JobApplicationsSimplifiedResponseDto,
    description:
      'Returns simplified format for recruiters, detailed format for others',
  })
  @ApiParam({
    name: 'jobId',
    type: 'number',
    description: 'ID of the job to get applications for',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of applications to return (default: 10)',
    example: 10,
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Number of applications to skip (default: 0)',
    example: 0,
  })
  async getJobApplications(
    @Param('jobId') jobId: string,
    @Query('limit') limit: string | undefined,
    @Query('offset') offset: string | undefined,
    @ReqContext() ctx: RequestContext,
  ): Promise<GetApplicationsResponse | JobApplicationsSimplifiedResponseDto> {
    const parsedJobId = Number(jobId);
    const parsedLimit = limit ? Number(limit) : 10;
    const parsedOffset = offset ? Number(offset) : 0;

    // Validate jobId - must be a valid positive integer
    if (
      isNaN(parsedJobId) ||
      parsedJobId <= 0 ||
      !Number.isInteger(parsedJobId)
    ) {
      throw new BadRequestException(
        'Invalid jobId parameter. Must be a positive integer.',
      );
    }

    // Validate that parsed values are valid numbers
    const validLimit = isNaN(parsedLimit) ? 10 : Math.max(1, parsedLimit);
    const validOffset = isNaN(parsedOffset) ? 0 : Math.max(0, parsedOffset);

    // Check if user is a recruiter and return simplified format
    const isRecruiter =
      ctx.user?.roles?.includes(ROLE.RECRUITER) ||
      ctx.user?.roles?.includes(ROLE.ADMIN_RECRUITER);

    if (isRecruiter) {
      const result =
        await this.jobApplicationService.getJobApplicationsSimplified({
          jobId: parsedJobId,
          user: ctx.user!,
          limit: validLimit,
          offset: validOffset,
        });

      return result;
    }

    // Default behavior for other roles
    const result = await this.jobApplicationService.getJobApplications({
      jobId: parsedJobId,
      user: ctx.user!,
      limit: validLimit,
      offset: validOffset,
    });

    return {
      data: result.applications,
      meta: {
        count: result.count,
      },
    };
  }

  @Get('hr')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get all applications for HR view',
    description:
      'Retrieves a paginated list of all applications for HR tracking',
  })
  @ApiOkResponse({ type: HrApplicationsResponseDto })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Pagination limit',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Pagination offset',
  })
  async getHrApplications(
    @Query('limit') limit: string | undefined,
    @Query('offset') offset: string | undefined,
    @ReqContext() ctx: RequestContext,
  ): Promise<GetHrApplicationsResponse> {
    // Parse and validate pagination parameters
    const parsedLimit = limit ? Number(limit) : 10;
    const parsedOffset = offset ? Number(offset) : 0;

    // Ensure limit is positive and offset is non-negative
    const validLimit =
      !isNaN(parsedLimit) && parsedLimit > 0 ? parsedLimit : 10;
    const validOffset =
      !isNaN(parsedOffset) && parsedOffset >= 0 ? parsedOffset : 0;

    // Verify user is authenticated
    if (!ctx.user) {
      throw new UnauthorizedException('User is required');
    }

    // Get applications from service
    const { applications, count } =
      await this.jobApplicationService.getHrApplications({
        user: ctx.user,
        limit: validLimit,
        offset: validOffset,
      });

    // Return paginated response
    return {
      data: applications,
      meta: { count },
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update job application status' })
  @ApiOkResponse({ type: UpdateJobApplicationResponseDto })
  async update(
    @Param('id') id: string,
    @Body() updateJobApplicationDto: UpdateJobApplicationDto,
    @ReqContext() ctx: RequestContext,
  ): Promise<UpdateApplicationResponse> {
    const result = await this.jobApplicationService.updateApplication({
      id: Number(id),
      dto: updateJobApplicationDto,
      user: ctx.user!,
    });

    return result;
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark job application as read' })
  @ApiOkResponse({ type: UpdateJobApplicationResponseDto })
  async markAsRead(
    @Param('id') id: string,
    @ReqContext() ctx: RequestContext,
  ): Promise<UpdateApplicationResponse> {
    const result = await this.jobApplicationService.markAsRead(
      Number(id),
      ctx.user!,
    );
    return result;
  }

  @Get(':id/user')
  @ApiOperation({
    summary: 'Get application details for candidate user',
    description:
      'Retrieve application details of a candidate excluding AI analysis fields',
  })
  @ApiParam({ name: 'id', type: 'number', description: 'Application ID' })
  @ApiOkResponse({ type: CandidateApplicationDetailResponseDto })
  async getApplicationByIdForUser(
    @Param('id') id: string,
    @ReqContext() ctx: RequestContext,
  ): Promise<CandidateApplicationDetailResponseDto> {
    const applicationDetail =
      await this.jobApplicationService.getApplicationByIdForCandidate(
        Number(id),
        ctx.user!,
      );

    // Fetch related interview schedules if candidate is a participant
    const interviewEvents = await this.scheduleService.getEventsByApplication(
      Number(id),
      ctx.user as any,
      EventType.INTERVIEW,
    );
    // Get the first non-cancelled interview event (for backward compatibility)
    const interviewEvent = interviewEvents.find(
      (e) => e.status !== EventStatus.CANCELLED,
    );

    return {
      id: applicationDetail.id,
      status: applicationDetail.status,
      cv_id: applicationDetail.cv_id,
      cover_letter: applicationDetail.cover_letter,
      applied_at: applicationDetail.applied_at,
      updated_at: applicationDetail.updated_at,
      job: applicationDetail.job,
      company: {
        id: applicationDetail.company.id,
        name: applicationDetail.company.name,
        logoUrl: applicationDetail.company.logoUrl,
        website: applicationDetail.company.website,
        phone: applicationDetail.company.phone?.toString(),
        email: applicationDetail.company.email,
        about: applicationDetail.company.about,
        contact: applicationDetail.company.contact,
      },
      interviewSchedule: interviewEvent
        ? {
            companyName: interviewEvent.companyName ?? '',
            createdBy: Number(interviewEvent.createdBy),
            title: interviewEvent.title,
            type: interviewEvent.type,
            status: interviewEvent.status,
            startsAt: interviewEvent.startsAt,
            endsAt: interviewEvent.endsAt,
            location: interviewEvent.location,
            notes: interviewEvent.notes,
            version: interviewEvent.version,
            createdAt: interviewEvent.createdAt,
            updatedAt: interviewEvent.updatedAt,
          }
        : undefined,
      interviewSchedules: interviewEvents.map((event) => ({
        companyName: event.companyName ?? '',
        createdBy: Number(event.createdBy),
        title: event.title,
        type: event.type,
        status: event.status,
        startsAt: event.startsAt,
        endsAt: event.endsAt,
        location: event.location,
        notes: event.notes,
        version: event.version,
        createdAt: event.createdAt,
        updatedAt: event.updatedAt,
      })),
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get job application by ID',
    description:
      'Retrieve a job application by its ID with proper user permissions',
  })
  @ApiParam({ name: 'id', type: 'number', description: 'Job application ID' })
  @ApiOkResponse({ type: ApplicationDetailResponseDto })
  async getApplicationById(
    @Param('id') id: string,
    @ReqContext() ctx: RequestContext,
  ) {
    const result = await this.jobApplicationService.getApplicationById(
      Number(id),
      ctx.user!,
    );

    return {
      data: {
        id: result.id.toString(),
        status: result.status,
        cv_id: result.cv_id,
        cover_letter: result.cover_letter,
        applied_at: result.applied_at,
        updated_at: result.updated_at,
      },
    };
  }

  @Get(':applicationId/detail')
  @ApiOperation({
    summary: 'Get detailed application information for company dashboard',
    description:
      'Retrieve comprehensive candidate and application details for company view',
  })
  @ApiOkResponse({ type: ApplicationDetailResponseDto })
  async getApplicationDetail(
    @Param('applicationId') applicationId: string,
    @ReqContext() ctx: RequestContext,
  ): Promise<ApplicationDetailResponseDto> {
    const applicationDetail =
      await this.jobApplicationService.getApplicationById(
        Number(applicationId),
        ctx.user!,
      );

    // Fetch related interview schedules (HR/company users can see company events)
    const interviewEvents = await this.scheduleService.getEventsByApplication(
      Number(applicationId),
      ctx.user as any,
      EventType.INTERVIEW,
    );
    // Get the first non-cancelled interview event (for backward compatibility)
    const interviewEvent = interviewEvents.find(
      (e) => e.status !== EventStatus.CANCELLED,
    );

    return {
      id: applicationDetail.id,
      status: applicationDetail.status,
      cv_id: applicationDetail.cv_id,
      cover_letter: applicationDetail.cover_letter,
      applied_at: applicationDetail.applied_at,
      updated_at: applicationDetail.updated_at,
      ai_status: applicationDetail.ai_status || 'PENDING_SCORE',
      ai_score: applicationDetail.ai_score || 0,
      ai_analysis:
        applicationDetail.ai_analysis || 'This application is pending analysis',
      candidate: applicationDetail.candidate,
      candidateProfile: applicationDetail.candidateProfile || undefined,
      job: applicationDetail.job,
      interviewSchedule: interviewEvent
        ? {
            companyName: interviewEvent.companyName ?? '',
            createdBy: Number(interviewEvent.createdBy),
            title: interviewEvent.title,
            type: interviewEvent.type,
            status: interviewEvent.status,
            startsAt: interviewEvent.startsAt,
            endsAt: interviewEvent.endsAt,
            location: interviewEvent.location,
            notes: interviewEvent.notes,
            version: interviewEvent.version,
            createdAt: interviewEvent.createdAt,
            updatedAt: interviewEvent.updatedAt,
          }
        : undefined,
      interviewSchedules: interviewEvents.map((event) => ({
        companyName: event.companyName ?? '',
        createdBy: Number(event.createdBy),
        title: event.title,
        type: event.type,
        status: event.status,
        startsAt: event.startsAt,
        endsAt: event.endsAt,
        location: event.location,
        notes: event.notes,
        version: event.version,
        createdAt: event.createdAt,
        updatedAt: event.updatedAt,
      })),
    };
  }
}
