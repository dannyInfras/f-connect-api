import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { PaginationParamsDto } from '../../../shared/dtos/pagination-params.dto';
import { AppLogger } from '../../../shared/logger/logger.service';
import { ReqContext } from '../../../shared/request-context/req-context.decorator';
import { RequestContext } from '../../../shared/request-context/request-context.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CreateJobApplicationDto } from '../dtos/create-job-application.dto';
import { PaginatedJobApplicationResponseDto } from '../dtos/job-appication-response.dto';
import { UpdateJobApplicationDto } from '../dtos/update-job-application.dto';
import { JobApplicationService } from '../services/job-application.service';
import {
  CreateApplicationResponse,
  GetApplicationsResponse,
  UpdateApplicationResponse,
} from '../types';

@ApiTags('Job Applications')
@Controller('applications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class JobApplicationController {
  constructor(
    private readonly jobApplicationService: JobApplicationService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(JobApplicationController.name);
  }

  @Post()
  @ApiOperation({ summary: 'Apply to a job' })
  @ApiResponse({
    status: 201,
    description: 'Application created successfully.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async create(
    @Body() createDto: CreateJobApplicationDto,
    @ReqContext() ctx: RequestContext,
  ): Promise<CreateApplicationResponse> {
    this.logger.log(ctx, `${this.create.name} was called`);

    return this.jobApplicationService.createApplication({
      dto: createDto,
      user: ctx.user!,
    });
  }

  @Get('user')
  @ApiOperation({ summary: 'Get all applications by the authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'List of user applications.',
    type: PaginatedJobApplicationResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @UseInterceptors(ClassSerializerInterceptor)
  async getUserApplications(
    @ReqContext() ctx: RequestContext,
    @Query() query: PaginationParamsDto,
  ): Promise<GetApplicationsResponse> {
    this.logger.log(ctx, `${this.getUserApplications.name} was called`);

    const { applications, count } =
      await this.jobApplicationService.getUserApplications({
        user: ctx.user!,
        limit: query.limit,
        offset: query.offset,
      });

    return { data: applications, meta: { count } };
  }

  @Get('job/:jobId')
  @ApiOperation({ summary: 'Get all applications for a specific job' })
  @ApiResponse({
    status: 200,
    description: 'List of job applications.',
    type: PaginatedJobApplicationResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @UseInterceptors(ClassSerializerInterceptor)
  async getJobApplications(
    @ReqContext() ctx: RequestContext,
    @Param('jobId') jobId: number,
    @Query() query: PaginationParamsDto,
  ): Promise<GetApplicationsResponse> {
    this.logger.log(ctx, `${this.getJobApplications.name} was called`);

    const { applications, count } =
      await this.jobApplicationService.getJobApplications({
        jobId,
        user: ctx.user!,
        limit: query.limit,
        offset: query.offset,
      });

    return { data: applications, meta: { count } };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a job application' })
  @ApiResponse({
    status: 200,
    description: 'Application updated successfully.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async update(
    @Param('id') id: number,
    @Body() updateDto: UpdateJobApplicationDto,
    @ReqContext() ctx: RequestContext,
  ): Promise<UpdateApplicationResponse> {
    this.logger.log(ctx, `${this.update.name} was called`);

    return this.jobApplicationService.updateApplication({
      id,
      dto: updateDto,
      user: ctx.user!,
    });
  }
}
