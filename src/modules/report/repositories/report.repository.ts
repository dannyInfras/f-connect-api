import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

import { Report, ReportStatus } from '../entities/report.entity';

@Injectable()
export class ReportRepository extends Repository<Report> {
  constructor(private dataSource: DataSource) {
    super(Report, dataSource.createEntityManager());
  }

  async getById(id: string): Promise<Report> {
    const report = await this.findOne({
      where: { id },
      relations: ['user', 'job', 'job.company'],
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    return report;
  }

  async getReportsWithPagination(
    page: number = 1,
    limit: number = 10,
    status?: ReportStatus,
    userId?: number,
  ): Promise<[Report[], number]> {
    const queryBuilder = this.createQueryBuilder('report')
      .leftJoinAndSelect('report.user', 'user')
      .leftJoinAndSelect('report.job', 'job')
      .leftJoinAndSelect('job.company', 'company')
      .orderBy('report.createdAt', 'DESC');

    if (status) {
      queryBuilder.andWhere('report.status = :status', { status });
    }

    if (userId) {
      queryBuilder.andWhere('report.userId = :userId', { userId });
    }

    const safeLimit =
      Number.isFinite(Number(limit)) && Number(limit) > 0 ? Number(limit) : 10;
    const safePage =
      Number.isFinite(Number(page)) && Number(page) > 0 ? Number(page) : 1;
    const offset = (safePage - 1) * safeLimit;

    return queryBuilder.skip(offset).take(safeLimit).getManyAndCount();
  }

  async getReportsByJobId(jobId: string): Promise<Report[]> {
    return this.find({
      where: { jobId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async getReportsByUserId(userId: number): Promise<Report[]> {
    return this.find({
      where: { userId },
      relations: ['job', 'job.company'],
      order: { createdAt: 'DESC' },
    });
  }

  async getReportsCountByStatus(): Promise<Record<ReportStatus, number>> {
    const result = await this.createQueryBuilder('report')
      .select('report.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('report.status')
      .getRawMany();

    const counts: Record<ReportStatus, number> = {
      [ReportStatus.PENDING]: 0,
      [ReportStatus.REVIEWED]: 0,
      [ReportStatus.RESOLVED]: 0,
      [ReportStatus.DISMISSED]: 0,
    };

    result.forEach((row) => {
      counts[row.status as ReportStatus] = parseInt(row.count, 10);
    });

    return counts;
  }

  async updateReportStatus(id: string, status: ReportStatus): Promise<Report> {
    const report = await this.getById(id);
    report.status = status;
    return this.save(report);
  }

  async checkExistingReport(
    userId: number,
    jobId: string,
  ): Promise<Report | null> {
    return this.findOne({
      where: { userId, jobId },
    });
  }
}
