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
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { JobService } from '@/modules/jobs/services/jobs.service';
import { BaseApiResponse } from '@/shared/dtos/base-api-response.dto';
import { PaginationParamsDto } from '@/shared/dtos/pagination-params.dto';
import { ReqContext } from '@/shared/request-context/req-context.decorator';
import { RequestContext } from '@/shared/request-context/request-context.dto';

import { CreateJobReqDto } from '../dtos/req/create-job.req';
import { UpdateJobDto } from '../dtos/req/update-job.req';
import { JobDetailResponseDto } from '../dtos/res/job.res';
import { ListJobResponseDto } from '../dtos/res/list-job.res';

@ApiTags('Jobs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobService: JobService) {}

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
    if (!ctx.user) {
      throw new UnauthorizedException('User must be logged in');
    }
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

  @Get(':id')
  @ApiOperation({ summary: 'Get job by ID' })
  @ApiResponse({
    status: 200,
    description: 'Job found successfully',
    schema: {
      example: JobDetailResponseDto.example,
    },
  })
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
    if (!ctx.user) {
      throw new UnauthorizedException('User must be logged in');
    }
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
}
