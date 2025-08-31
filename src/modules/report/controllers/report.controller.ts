import {
  Body,
  Controller,
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
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { ROLE } from '@/modules/auth/constants/role.constant';
import { Roles } from '@/modules/auth/decorators/role.decorator';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { PaginationParamsDto } from '@/shared/dtos/pagination-params.dto';
import { ReqContext } from '@/shared/request-context/req-context.decorator';
import { RequestContext } from '@/shared/request-context/request-context.dto';

import { CreateReportDto } from '../dtos/req/create-report.dto';
import { HideJobDto } from '../dtos/req/hide-job.dto';
import { UpdateReportStatusDto } from '../dtos/req/update-report-status.dto';
import { ReportResponseDto } from '../dtos/res/report-response.dto';
import { ReportsListResponseDto } from '../dtos/res/reports-list-response.dto';
import { ReportStatus } from '../entities/report.entity';
import { ReportService } from '../services/report.service';

@ApiTags('Reports')
@Controller('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new job report' })
  @ApiResponse({
    status: 201,
    description: 'Report created successfully',
    type: ReportResponseDto,
    schema: {
      example: {
        id: '1',
        title: 'Misleading job requirements',
        description:
          'This job posting requires 10+ years of experience for an entry-level position. The salary range is also unrealistic for the market rate and the job description contains discriminatory language.',
        status: 'PENDING',
        userId: 42,
        jobId: '123456789',
        createdAt: '2025-01-09T10:30:00.000Z',
        updatedAt: '2025-01-09T10:30:00.000Z',
        user: {
          id: 42,
          name: 'John Doe',
          email: 'john.doe@example.com',
        },
        job: {
          id: '123456789',
          title: 'Senior Software Engineer',
          location: 'Ho Chi Minh City',
          company: {
            id: '987654321',
            name: 'Tech Company ABC',
          },
        },
      },
    },
  })
  async create(
    @Body() dto: CreateReportDto,
    @ReqContext() ctx: RequestContext,
  ): Promise<ReportResponseDto> {
    if (!ctx.user) {
      throw new UnauthorizedException('User must be logged in');
    }
    return this.reportService.createReport(ctx.user, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all reports (Admin only)' })
  @Roles(ROLE.ADMIN, ROLE.ADMIN_RECRUITER)
  @UseGuards(RolesGuard)
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: ReportStatus })
  @ApiResponse({
    status: 200,
    description: 'Reports retrieved successfully',
    type: ReportsListResponseDto,
  })
  async getAllReports(
    @Query()
    query: PaginationParamsDto & { status?: ReportStatus; page?: number },
    @ReqContext() ctx: RequestContext,
  ): Promise<ReportsListResponseDto> {
    if (!ctx.user) {
      throw new UnauthorizedException('User must be logged in');
    }
    const limit = Number(query.limit) || 10;
    const rawPage: any = (query as any).page;
    const pageParam = rawPage !== undefined ? Number(rawPage) : undefined;
    const offset = query.offset !== undefined ? Number(query.offset) : 0;
    const page =
      pageParam && pageParam > 0 ? pageParam : Math.floor(offset / limit) + 1;
    return this.reportService.getAllReports(
      ctx.user,
      page,
      limit,
      query.status,
    );
  }

  @Get('my-reports')
  @ApiOperation({ summary: 'Get current user reports' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'User reports retrieved successfully',
    type: ReportsListResponseDto,
  })
  async getMyReports(
    @Query() query: PaginationParamsDto & { page?: number },
    @ReqContext() ctx: RequestContext,
  ): Promise<ReportsListResponseDto> {
    if (!ctx.user) {
      throw new UnauthorizedException('User must be logged in');
    }
    const limit = Number(query.limit) || 10;
    const rawPage: any = (query as any).page;
    const pageParam = rawPage !== undefined ? Number(rawPage) : undefined;
    const offset = query.offset !== undefined ? Number(query.offset) : 0;
    const page =
      pageParam && pageParam > 0 ? pageParam : Math.floor(offset / limit) + 1;
    return this.reportService.getMyReports(ctx.user, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get report by ID' })
  @ApiResponse({
    status: 200,
    description: 'Report retrieved successfully',
    type: ReportResponseDto,
  })
  async getReportById(
    @Param('id') id: string,
    @ReqContext() ctx: RequestContext,
  ): Promise<ReportResponseDto> {
    if (!ctx.user) {
      throw new UnauthorizedException('User must be logged in');
    }
    return this.reportService.getReportById(ctx.user, id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update report status (Admin only)' })
  @Roles(ROLE.ADMIN, ROLE.ADMIN_RECRUITER)
  @UseGuards(RolesGuard)
  @ApiResponse({
    status: 200,
    description: 'Report status updated successfully',
    type: ReportResponseDto,
  })
  async updateReportStatus(
    @Param('id') id: string,
    @Body() dto: UpdateReportStatusDto,
    @ReqContext() ctx: RequestContext,
  ): Promise<ReportResponseDto> {
    if (!ctx.user) {
      throw new UnauthorizedException('User must be logged in');
    }
    return this.reportService.updateReportStatus(ctx.user, id, dto);
  }

  @Post('hide-job')
  @ApiOperation({ summary: 'Hide a job (Admin only)' })
  @Roles(ROLE.ADMIN, ROLE.ADMIN_RECRUITER)
  @UseGuards(RolesGuard)
  @ApiResponse({
    status: 200,
    description: 'Job hidden successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Job has been hidden successfully',
        },
      },
    },
  })
  async hideJob(
    @Body() dto: HideJobDto,
    @ReqContext() ctx: RequestContext,
  ): Promise<{ message: string }> {
    if (!ctx.user) {
      throw new UnauthorizedException('User must be logged in');
    }
    return this.reportService.hideJob(ctx.user, dto);
  }

  @Get('stats/overview')
  @ApiOperation({ summary: 'Get reports statistics (Admin only)' })
  @Roles(ROLE.ADMIN, ROLE.ADMIN_RECRUITER)
  @UseGuards(RolesGuard)
  @ApiResponse({
    status: 200,
    description: 'Reports statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalReports: { type: 'number', example: 25 },
        reportsByStatus: {
          type: 'object',
          properties: {
            PENDING: { type: 'number', example: 10 },
            REVIEWED: { type: 'number', example: 5 },
            RESOLVED: { type: 'number', example: 8 },
            DISMISSED: { type: 'number', example: 2 },
          },
        },
      },
    },
  })
  async getReportsStats(@ReqContext() ctx: RequestContext): Promise<{
    totalReports: number;
    reportsByStatus: Record<ReportStatus, number>;
  }> {
    if (!ctx.user) {
      throw new UnauthorizedException('User must be logged in');
    }
    return this.reportService.getReportsStats(ctx.user);
  }
}
