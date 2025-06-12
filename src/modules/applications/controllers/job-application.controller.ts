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
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { ReqContext } from '@/shared/request-context/req-context.decorator';
import { RequestContext } from '@/shared/request-context/request-context.dto';

import { ApplicationDetailResponseDto } from '../dtos/application-detail-response.dto';
import { CreateJobApplicationDto } from '../dtos/create-job-application.dto';
import { JobApplicationResponseDto } from '../dtos/job-appication-response.dto';
import { UpdateJobApplicationDto } from '../dtos/update-job-application.dto';
import { UpdateJobApplicationResponseDto } from '../dtos/update-job-application-response.dto';
import { JobApplicationService } from '../services/job-application.service';
import { GetApplicationsResponse, UpdateApplicationResponse } from '../types';

@ApiTags('job-applications')
@Controller('applications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class JobApplicationController {
  constructor(private readonly jobApplicationService: JobApplicationService) {}

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
  @ApiOkResponse({ type: JobApplicationResponseDto, isArray: true })
  async getJobApplications(
    @Param('jobId') jobId: string,
    @Query('limit') limit: string | undefined,
    @Query('offset') offset: string | undefined,
    @ReqContext() ctx: RequestContext,
  ): Promise<GetApplicationsResponse> {
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

    return {
      id: applicationDetail.id,
      status: applicationDetail.status,
      cv_id: applicationDetail.cv_id,
      cover_letter: applicationDetail.cover_letter,
      applied_at: applicationDetail.applied_at,
      updated_at: applicationDetail.updated_at,
      candidate: applicationDetail.candidate,
      candidateProfile: applicationDetail.candidateProfile || undefined,
      job: applicationDetail.job,
    };
  }
}
