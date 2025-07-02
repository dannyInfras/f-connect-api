import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { ROLE } from '@/modules/auth/constants/role.constant';
import { Roles } from '@/modules/auth/decorators/role.decorator';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { JobService } from '@/modules/jobs/services/jobs.service';
import { Public } from '@/shared/decorators/public.decorator';
import { BaseApiResponse } from '@/shared/dtos/base-api-response.dto';
import { PaginationParamsDto } from '@/shared/dtos/pagination-params.dto';
import { ReqContext } from '@/shared/request-context/req-context.decorator';
import { RequestContext } from '@/shared/request-context/request-context.dto';

import { CreateJobReqDto } from '../dtos/req/create-job.req';
import { UpdateJobDto } from '../dtos/req/update-job.req';
import { HrJobsListResponseDto } from '../dtos/res/hr-jobs-response.dto';
import { JobDetailResponseDto } from '../dtos/res/job.res';
import { ListJobResponseDto } from '../dtos/res/list-job.res';
import { JobSchedulerService } from '../job-scheduler.service';

@ApiTags('Jobs')
@Controller('jobs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class JobsController {
  constructor(
    private readonly jobService: JobService,
    private readonly jobSchedulerService: JobSchedulerService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new job' })
  @ApiResponse({
    status: 201,
    description: 'Job created successfully',
    schema: {
      example: JobDetailResponseDto.example,
    },
  })
  async create(
    @Body() dto: CreateJobReqDto,
    @ReqContext() ctx: RequestContext,
  ): Promise<JobDetailResponseDto> {
    if (!ctx.user) {
      throw new UnauthorizedException('User must be logged in');
    }
    return this.jobService.create(ctx.user, dto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all jobs with pagination' })
  @ApiResponse({
    status: 200,
    description: 'List all jobs',
    type: ListJobResponseDto,
  })
  async findAll(
    @Query() query: PaginationParamsDto,
    @ReqContext() ctx: RequestContext,
  ): Promise<ListJobResponseDto> {
    const { jobs, count } = await this.jobService.findAll(
      ctx.user,
      query.limit,
      query.offset,
    );

    return {
      data: jobs,
      meta: {
        count,
        page: Math.floor(query.offset / query.limit) + 1,
      },
    };
  }

  @Public()
  @Get('company/:companyId')
  @ApiOperation({ summary: 'Get jobs for a company with pagination' })
  @ApiResponse({
    status: 200,
    type: ListJobResponseDto,
    description: 'List of jobs for a company with pagination metadata',
  })
  async findJobsByCompany(
    @Param('companyId') companyId: string,
    @Query() query: PaginationParamsDto,
  ): Promise<ListJobResponseDto> {
    const { jobs, count } = await this.jobService.findJobsByCompany(
      companyId,
      query.limit,
      query.offset,
    );

    return {
      data: jobs,
      meta: {
        count,
        page: Math.floor(query.offset / query.limit) + 1,
      },
    };
  }

  @Get('company/:companyId/hr')
  @ApiOperation({ summary: 'Get jobs for a company (HR view) with pagination' })
  @ApiResponse({
    status: 200,
    type: HrJobsListResponseDto,
    description:
      'List of jobs for a company with application counts and pagination',
  })
  async findJobsByCompanyForHr(
    @Param('companyId') companyId: string,
    @Query() query: PaginationParamsDto,
    @ReqContext() ctx: RequestContext,
  ): Promise<HrJobsListResponseDto> {
    if (!ctx.user) {
      throw new UnauthorizedException('User must be logged in');
    }
    const { jobs, count } = await this.jobService.findJobsByCompanyForHr(
      ctx.user,
      companyId,
      query.limit,
      query.offset,
    );

    return {
      data: jobs,
      meta: {
        count,
        page: Math.floor(query.offset / query.limit) + 1,
      },
    };
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get job by ID' })
  @ApiResponse({
    status: 200,
    description: 'Job found successfully',
    schema: {
      example: JobDetailResponseDto.example,
    },
  })
  async findOne(
    @Param('id') id: string,
    @ReqContext() ctx: RequestContext,
  ): Promise<BaseApiResponse<JobDetailResponseDto>> {
    const job = await this.jobService.findOne(ctx.user, id);
    return {
      data: job,
      meta: {},
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update job posting' })
  @ApiResponse({
    status: 200,
    description: 'Job updated successfully',
    schema: {
      example: JobDetailResponseDto.example,
    },
  })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateJobDto,
    @ReqContext() ctx: RequestContext,
  ): Promise<BaseApiResponse<JobDetailResponseDto>> {
    if (!ctx.user) {
      throw new UnauthorizedException('User must be logged in');
    }
    const job = await this.jobService.update(ctx.user, id, dto);
    return {
      data: job,
      meta: {},
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete job posting' })
  @ApiResponse({
    status: 200,
    description: 'Job deleted successfully',
  })
  async delete(
    @Param('id') id: string,
    @ReqContext() ctx: RequestContext,
  ): Promise<void> {
    if (!ctx.user) {
      throw new UnauthorizedException('User must be logged in');
    }
    await this.jobService.delete(ctx.user, id);
  }

  @Post('test-vip-expiration')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Test VIP expiration for all jobs' })
  @ApiResponse({
    status: 200,
    description: 'VIP expiration check triggered successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'VIP expiration check triggered successfully' }
      }
    }
  })
  async testVipExpiration() {
    // Run both checks
    await this.jobSchedulerService.checkExpiredVipJobs();
    await this.jobSchedulerService.checkSoonToExpireVipJobs();
    
    return { 
      success: true, 
      message: 'VIP expiration check triggered successfully' 
    };
  }

  @Post('test-job-expiration/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Test VIP expiration for a specific job' })
  @ApiParam({ name: 'id', description: 'Job ID to test expiration for' })
  @ApiResponse({
    status: 200,
    description: 'Job expiration test results',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Successfully tested VIP expiration for job 123. Original expiry date has been restored.' }
      }
    }
  })
  async testJobExpiration(@Param('id') id: string) {
    return this.jobSchedulerService.testJobExpiration(id);
  }

  @Post('test-job-expiration-warning/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Test VIP expiration warning for a specific job' })
  @ApiParam({ name: 'id', description: 'Job ID to test expiration warning for' })
  @ApiResponse({
    status: 200,
    description: 'Job expiration warning test results',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Successfully tested VIP expiration warning for job 123. Original expiry date has been restored.' }
      }
    }
  })
  async testJobExpirationWarning(@Param('id') id: string) {
    return this.jobSchedulerService.testJobExpirationWarning(id);
  }
}
