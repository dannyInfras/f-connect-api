import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { JobRepository } from '@/modules/jobs/repositories/jobs.repository';
import { ReportAclService } from '@/modules/report/acl/report.acl';
import { Action } from '@/shared/acl/action.constant';
import { Actor } from '@/shared/acl/actor.constant';
import { AppLogger } from '@/shared/logger/logger.service';
import { MailService } from '@/shared/mail/mail.service';
import { RequestContext } from '@/shared/request-context/request-context.dto';

import { CreateReportDto } from '../dtos/req/create-report.dto';
import { HideJobDto } from '../dtos/req/hide-job.dto';
import { UpdateReportStatusDto } from '../dtos/req/update-report-status.dto';
import { ReportResponseDto } from '../dtos/res/report-response.dto';
import { ReportsListResponseDto } from '../dtos/res/reports-list-response.dto';
import { Report, ReportStatus } from '../entities/report.entity';
import { ReportRepository } from '../repositories/report.repository';

@Injectable()
export class ReportService {
  constructor(
    private repository: ReportRepository,
    private jobRepository: JobRepository,
    private aclService: ReportAclService,
    private readonly logger: AppLogger,
    private readonly mailService: MailService,
  ) {
    this.logger.setContext(ReportService.name);
  }

  async createReport(
    actor: Actor,
    dto: CreateReportDto,
  ): Promise<ReportResponseDto> {
    // Check if user can create report
    await this.aclService.canCreate(actor);

    // Verify job exists
    const job = await this.jobRepository.findOne({
      where: { id: dto.jobId, isDeleted: false },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    // Check if user already reported this job
    const existingReport = await this.repository.checkExistingReport(
      actor.id,
      dto.jobId,
    );

    if (existingReport) {
      throw new BadRequestException('You have already reported this job');
    }

    // Create report
    const reportData = {
      title: dto.title,
      description: dto.description,
      userId: actor.id,
      jobId: dto.jobId,
      status: ReportStatus.PENDING,
    };

    const report = await this.repository.save(reportData);

    // Return with populated relations
    const savedReport = await this.repository.getById(report.id);
    return this.mapToResponseDto(savedReport);
  }

  async getAllReports(
    actor: Actor,
    page: number = 1,
    limit: number = 10,
    status?: ReportStatus,
  ): Promise<ReportsListResponseDto> {
    // Check if user can view reports
    await this.aclService.canList();

    const [reports, total] = await this.repository.getReportsWithPagination(
      page,
      limit,
      status,
    );

    const totalPages = Math.ceil(total / limit);

    return {
      reports: reports.map((report) => this.mapToResponseDto(report)),
      total,
      page,
      limit,
      totalPages,
    };
  }

  async getReportById(actor: Actor, id: string): Promise<ReportResponseDto> {
    // Check if user can view report
    await this.aclService.canView();

    const report = await this.repository.getById(id);

    // Users can only view their own reports unless they have admin privileges
    if (!this.aclService.forActor(actor).canDoAction(Action.Update, report)) {
      if (report.userId !== actor.id) {
        throw new UnauthorizedException('You can only view your own reports');
      }
    }

    return this.mapToResponseDto(report);
  }

  async getMyReports(
    actor: Actor,
    page: number = 1,
    limit: number = 10,
  ): Promise<ReportsListResponseDto> {
    const [reports, total] = await this.repository.getReportsWithPagination(
      page,
      limit,
      undefined,
      actor.id,
    );

    const totalPages = Math.ceil(total / limit);

    return {
      reports: reports.map((report) => this.mapToResponseDto(report)),
      total,
      page,
      limit,
      totalPages,
    };
  }

  async updateReportStatus(
    actor: Actor,
    id: string,
    dto: UpdateReportStatusDto,
  ): Promise<ReportResponseDto> {
    // Check if user can update report status (admin only)
    await this.aclService.canUpdate();

    const report = await this.repository.getById(id);

    // Update status
    report.status = dto.status;
    const updatedReport = await this.repository.save(report);

    // Return with populated relations
    const savedReport = await this.repository.getById(updatedReport.id);

    // Send email notification to reporter (best-effort)
    try {
      const to = savedReport.user?.email;
      if (to) {
        const jobTitle = savedReport.job?.title || 'Job';
        const subject = `Your report status was updated: ${jobTitle}`;
        const frontendUrl = process.env.FRONTEND_URL || '';
        const reportUrl = `${frontendUrl}/reports/${savedReport.id}`;
        const jobUrl = `${frontendUrl}/jobs/${savedReport.jobId}`;

        await this.mailService.sendMail(to, subject, 'report-status-updated', {
          reporterName: savedReport.user?.name || 'there',
          reportTitle: savedReport.title,
          jobTitle,
          status: savedReport.status,
          adminNote: dto.adminNote || '',
          reportUrl,
          jobUrl,
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      const ctx = new RequestContext();
      ctx.requestID = 'report-status-email';
      ctx.url = 'report-service';
      ctx.user = null;
      this.logger.error(
        ctx,
        'Failed to send report status email',
        error instanceof Error ? error.stack : undefined,
        { error: error instanceof Error ? error.message : String(error) },
      );
    }

    return this.mapToResponseDto(savedReport);
  }

  async hideJob(actor: Actor, dto: HideJobDto): Promise<{ message: string }> {
    // Check if user can hide jobs (admin only)
    await this.aclService.canUpdate();

    const job = await this.jobRepository.findOne({
      where: { id: dto.jobId, isDeleted: false },
      relations: ['company'],
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    // Soft delete the job
    job.isDeleted = true;
    await this.jobRepository.save(job);

    const ctx = new RequestContext();
    ctx.requestID = 'hide-job';
    ctx.url = 'report-service';
    ctx.user = null;

    this.logger.log(
      ctx,
      `Job ${dto.jobId} hidden by admin ${actor.id}. Reason: ${dto.reason || 'No reason provided'}`,
    );

    // Notify company via email (best-effort)
    try {
      const companyEmail = job.company?.email;
      if (companyEmail) {
        const subject = `Your job has been hidden: ${job.title}`;
        const dashboardUrl = `${process.env.FRONTEND_URL || ''}/company/jobs/${job.id}`;

        await this.mailService.sendMail(companyEmail, subject, 'job-hidden', {
          companyName: job.company?.companyName || 'Your Company',
          jobTitle: job.title,
          jobId: job.id,
          reason: dto.reason || 'No reason provided',
          dashboardUrl,
        });
      }
    } catch (error) {
      const emailCtx = new RequestContext();
      emailCtx.requestID = 'job-hidden-email';
      emailCtx.url = 'report-service';
      emailCtx.user = null;
      this.logger.error(
        emailCtx,
        'Failed to send job hidden email',
        error instanceof Error ? error.stack : undefined,
        { error: error instanceof Error ? error.message : String(error) },
      );
    }

    return {
      message: 'Job has been hidden successfully',
    };
  }

  async getReportsStats(actor: Actor): Promise<{
    totalReports: number;
    reportsByStatus: Record<ReportStatus, number>;
  }> {
    // Check if user can view reports
    await this.aclService.canList();
    if (actor) {
      // reference actor to satisfy unused-var lint
    }

    const [allReports] = await this.repository.getReportsWithPagination(1, 1);
    const reportsByStatus = await this.repository.getReportsCountByStatus();

    return {
      totalReports: allReports.length > 0 ? await this.repository.count() : 0,
      reportsByStatus,
    };
  }

  private mapToResponseDto(report: Report): ReportResponseDto {
    return {
      id: report.id,
      title: report.title,
      description: report.description,
      status: report.status,
      userId: report.userId,
      jobId: report.jobId,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
      user: report.user
        ? {
            id: report.user.id,
            name: report.user.name,
            email: report.user.email,
          }
        : undefined,
      job: report.job
        ? {
            id: report.job.id,
            title: report.job.title,
            location: report.job.location,
            company: report.job.company
              ? {
                  id: report.job.company.id,
                  name: report.job.company.companyName,
                }
              : undefined,
          }
        : undefined,
    };
  }
}
