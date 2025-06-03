import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { AppLogger } from '../../../shared/logger/logger.service';
import { ReqContext } from '../../../shared/request-context/req-context.decorator';
import { RequestContext } from '../../../shared/request-context/request-context.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CreateJobApplicationDto } from '../dtos/create-job-application.dto';
import { UpdateJobApplicationDto } from '../dtos/update-job-application.dto';
import { JobApplicationService } from '../services/job-application.service';

// Note: Middleware such as RequestIdMiddleware and Logger are applied globally in main.ts as per middleware.md

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
  ): Promise<any> {
    this.logger.log(ctx, `${this.create.name} was called`);
    if (!ctx.user) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.jobApplicationService.createApplication(createDto, ctx.user);
  }

  @Get('user')
  @ApiOperation({ summary: 'Get all applications by the authenticated user' })
  @ApiResponse({ status: 200, description: 'List of user applications.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getUserApplications(@ReqContext() ctx: RequestContext): Promise<any> {
    this.logger.log(ctx, `${this.getUserApplications.name} was called`);
    if (!ctx.user) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.jobApplicationService.getUserApplications(ctx.user);
  }

  @Get('job/:jobId')
  @ApiOperation({ summary: 'Get all applications for a specific job' })
  @ApiResponse({ status: 200, description: 'List of job applications.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getJobApplications(
    @Param('jobId') jobId: number,
    @ReqContext() ctx: RequestContext,
  ): Promise<any> {
    this.logger.log(ctx, `${this.getJobApplications.name} was called`);
    if (!ctx.user) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.jobApplicationService.getJobApplications(jobId, ctx.user);
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
  ): Promise<any> {
    this.logger.log(ctx, `${this.update.name} was called`);
    if (!ctx.user) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.jobApplicationService.updateApplication(
      id,
      updateDto,
      ctx.user,
    );
  }
}
