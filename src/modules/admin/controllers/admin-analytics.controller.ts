import { Controller, Get, HttpStatus, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { ROLE } from '@/modules/auth/constants/role.constant';
import { Roles } from '@/modules/auth/decorators/role.decorator';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import {
  BaseApiErrorResponse,
  BaseApiResponse,
  SwaggerBaseApiResponse,
} from '@/shared/dtos/base-api-response.dto';
import { AppLogger } from '@/shared/logger/logger.service';
import { ReqContext } from '@/shared/request-context/req-context.decorator';
import { RequestContext } from '@/shared/request-context/request-context.dto';

import { AnalyticsQueryDto } from '../dtos/analytics-query.dto';
import { ApplicationAnalyticsResponseDto } from '../dtos/application-analytics.dto';
import { CompanyAnalyticsResponseDto } from '../dtos/company-analytics.dto';
import { DashboardAnalyticsResponseDto } from '../dtos/dashboard-analytics.dto';
import { JobAnalyticsResponseDto } from '../dtos/job-analytics.dto';
import { UserAnalyticsResponseDto } from '../dtos/user-analytics.dto';
import { AdminAnalyticsService } from '../services/admin-analytics.service';

/**
 * Admin Analytics Controller
 * Provides comprehensive analytics endpoints for administrators
 */
@ApiTags('Admin Analytics')
@Controller('admin/analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Roles(ROLE.ADMIN)
export class AdminAnalyticsController {
  constructor(
    private readonly analyticsService: AdminAnalyticsService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(AdminAnalyticsController.name);
  }

  /**
   * Get dashboard analytics overview
   * Provides key metrics, recent activity, and system alerts
   */
  @Get('dashboard')
  @ApiOperation({
    summary: 'Get dashboard analytics',
    description:
      'Retrieve comprehensive dashboard analytics including key metrics, recent activity, and system alerts',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse(DashboardAnalyticsResponseDto),
    description: 'Dashboard analytics retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    type: BaseApiErrorResponse,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    type: BaseApiErrorResponse,
  })
  async getDashboardAnalytics(
    @ReqContext() ctx: RequestContext,
  ): Promise<BaseApiResponse<DashboardAnalyticsResponseDto>> {
    this.logger.log(ctx, `${this.getDashboardAnalytics.name} was called`);

    const data = await this.analyticsService.getDashboardAnalytics(
      ctx,
      ctx.user!,
    );

    return {
      data,
      meta: {
        apiVersion: '1.0',
      },
    };
  }

  /**
   * Get user analytics
   * Provides user registration trends, demographics, and activity metrics
   */
  @Get('users')
  @ApiOperation({
    summary: 'Get user analytics',
    description:
      'Retrieve comprehensive user analytics including registration trends, demographics, and activity metrics',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse(UserAnalyticsResponseDto),
    description: 'User analytics retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    type: BaseApiErrorResponse,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    type: BaseApiErrorResponse,
  })
  async getUserAnalytics(
    @ReqContext() ctx: RequestContext,
    @Query() query: AnalyticsQueryDto,
  ): Promise<BaseApiResponse<UserAnalyticsResponseDto>> {
    this.logger.log(ctx, `${this.getUserAnalytics.name} was called`);

    const startDate = query.startDate ? new Date(query.startDate) : undefined;
    const endDate = query.endDate ? new Date(query.endDate) : undefined;

    const data = await this.analyticsService.getUserAnalytics(
      ctx,
      ctx.user!,
      startDate,
      endDate,
      query.interval,
    );

    return {
      data,
      meta: {
        apiVersion: '1.0',
        query: {
          startDate: query.startDate,
          endDate: query.endDate,
          interval: query.interval || 'monthly',
        },
      },
    };
  }

  /**
   * Get job market analytics
   * Provides job posting trends, category analysis, salary insights, and VIP job metrics
   */
  @Get('jobs')
  @ApiOperation({
    summary: 'Get job market analytics',
    description:
      'Retrieve comprehensive job market analytics including posting trends, category analysis, salary insights, and VIP job metrics',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse(JobAnalyticsResponseDto),
    description: 'Job analytics retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    type: BaseApiErrorResponse,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    type: BaseApiErrorResponse,
  })
  async getJobAnalytics(
    @ReqContext() ctx: RequestContext,
    @Query() query: AnalyticsQueryDto,
  ): Promise<BaseApiResponse<JobAnalyticsResponseDto>> {
    this.logger.log(ctx, `${this.getJobAnalytics.name} was called`);

    const startDate = query.startDate ? new Date(query.startDate) : undefined;
    const endDate = query.endDate ? new Date(query.endDate) : undefined;

    const data = await this.analyticsService.getJobAnalytics(
      ctx,
      ctx.user!,
      startDate,
      endDate,
      query.interval,
    );

    return {
      data,
      meta: {
        apiVersion: '1.0',
        query: {
          startDate: query.startDate,
          endDate: query.endDate,
          interval: query.interval || 'monthly',
        },
      },
    };
  }

  /**
   * Get application analytics
   * Provides application trends, conversion rates, AI insights, and performance metrics
   */
  @Get('applications')
  @ApiOperation({
    summary: 'Get application analytics',
    description:
      'Retrieve comprehensive application analytics including trends, conversion rates, AI insights, and performance metrics',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse(ApplicationAnalyticsResponseDto),
    description: 'Application analytics retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    type: BaseApiErrorResponse,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    type: BaseApiErrorResponse,
  })
  async getApplicationAnalytics(
    @ReqContext() ctx: RequestContext,
    @Query() query: AnalyticsQueryDto,
  ): Promise<BaseApiResponse<ApplicationAnalyticsResponseDto>> {
    this.logger.log(ctx, `${this.getApplicationAnalytics.name} was called`);

    const startDate = query.startDate ? new Date(query.startDate) : undefined;
    const endDate = query.endDate ? new Date(query.endDate) : undefined;

    const data = await this.analyticsService.getApplicationAnalytics(
      ctx,
      ctx.user!,
      startDate,
      endDate,
      query.interval,
    );

    return {
      data,
      meta: {
        apiVersion: '1.0',
        query: {
          startDate: query.startDate,
          endDate: query.endDate,
          interval: query.interval || 'monthly',
        },
      },
    };
  }

  /**
   * Get company analytics
   * Provides company growth, industry analysis, and hiring activity metrics
   */
  @Get('companies')
  @ApiOperation({
    summary: 'Get company analytics',
    description:
      'Retrieve comprehensive company analytics including growth metrics, industry analysis, and hiring activity',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse(CompanyAnalyticsResponseDto),
    description: 'Company analytics retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    type: BaseApiErrorResponse,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    type: BaseApiErrorResponse,
  })
  async getCompanyAnalytics(
    @ReqContext() ctx: RequestContext,
    @Query() query: AnalyticsQueryDto,
  ): Promise<BaseApiResponse<CompanyAnalyticsResponseDto>> {
    this.logger.log(ctx, `${this.getCompanyAnalytics.name} was called`);

    const startDate = query.startDate ? new Date(query.startDate) : undefined;
    const endDate = query.endDate ? new Date(query.endDate) : undefined;

    const data = await this.analyticsService.getCompanyAnalytics(
      ctx,
      ctx.user!,
      startDate,
      endDate,
      query.interval,
    );

    return {
      data,
      meta: {
        apiVersion: '1.0',
        query: {
          startDate: query.startDate,
          endDate: query.endDate,
          interval: query.interval || 'monthly',
        },
      },
    };
  }

  /**
   * Get comprehensive analytics export
   * Provides all analytics data in a single response for reporting purposes
   */
  @Get('export')
  @ApiOperation({
    summary: 'Export comprehensive analytics',
    description:
      'Retrieve all analytics data in a single response for reporting and export purposes',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Analytics data exported successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    type: BaseApiErrorResponse,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    type: BaseApiErrorResponse,
  })
  async exportAnalytics(
    @ReqContext() ctx: RequestContext,
    @Query() query: AnalyticsQueryDto,
  ): Promise<
    BaseApiResponse<{
      dashboard: DashboardAnalyticsResponseDto;
      users: UserAnalyticsResponseDto;
      jobs: JobAnalyticsResponseDto;
      applications: ApplicationAnalyticsResponseDto;
      companies: CompanyAnalyticsResponseDto;
    }>
  > {
    this.logger.log(ctx, `${this.exportAnalytics.name} was called`);

    const startDate = query.startDate ? new Date(query.startDate) : undefined;
    const endDate = query.endDate ? new Date(query.endDate) : undefined;

    // Get all analytics data in parallel
    const [dashboard, users, jobs, applications, companies] = await Promise.all(
      [
        this.analyticsService.getDashboardAnalytics(ctx, ctx.user!),
        this.analyticsService.getUserAnalytics(
          ctx,
          ctx.user!,
          startDate,
          endDate,
          query.interval,
        ),
        this.analyticsService.getJobAnalytics(
          ctx,
          ctx.user!,
          startDate,
          endDate,
          query.interval,
        ),
        this.analyticsService.getApplicationAnalytics(
          ctx,
          ctx.user!,
          startDate,
          endDate,
          query.interval,
        ),
        this.analyticsService.getCompanyAnalytics(
          ctx,
          ctx.user!,
          startDate,
          endDate,
          query.interval,
        ),
      ],
    );

    return {
      data: {
        dashboard,
        users,
        jobs,
        applications,
        companies,
      },
      meta: {
        apiVersion: '1.0',
        exportedAt: new Date().toISOString(),
        query: {
          startDate: query.startDate,
          endDate: query.endDate,
          interval: query.interval || 'monthly',
        },
      },
    };
  }
}
