import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { CategoryRepository } from '@/modules/category/repositories/category.repository';
import { JobAclService } from '@/modules/jobs/acl/jobs.acl';
import { JobRepository } from '@/modules/jobs/repositories/jobs.repository';
import { Skill } from '@/modules/skill/entities/skill.entity';
import { SkillRepository } from '@/modules/skill/repositories/skill.repository';
import { Action } from '@/shared/acl/action.constant';
import { Actor } from '@/shared/acl/actor.constant';
import { AppLogger } from '@/shared/logger/logger.service';
import { RequestContext } from '@/shared/request-context/request-context.dto';

import { CreateJobReqDto } from '../dtos/req/create-job.req';
import { HrJobResponseDto } from '../dtos/res/hr-jobs-response.dto';
import { JobDetailResponseDto } from '../dtos/res/job.res';
import {
  JobStatisticsResponseDto,
  TopCandidateDto,
} from '../dtos/res/job-statistics.res';
import { JobResponseDto } from '../dtos/res/list-job.res';
import { TopJobResponseDto } from '../dtos/res/top-job.res';
import { JobMapper } from '../mapper/job.mapper';

@Injectable()
export class JobService {
  constructor(
    private repository: JobRepository,
    private categoryRepository: CategoryRepository,
    private skillRepository: SkillRepository,
    private aclService: JobAclService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(JobService.name);
  }

  async getJobStatistics(jobId: string): Promise<JobStatisticsResponseDto> {
    const job = await this.repository.findOne({ where: { id: jobId } });
    if (!job) {
      throw new NotFoundException('Job not found');
    }

    const [
      totalAppsRaw,
      statusCountsRaw,
      avgScoreRaw,
      topCandidatesRaw,
      genderRaw,
      ageBucketsRaw,
      locationsRaw,
    ] = await Promise.all([
      this.repository.query(
        'SELECT COUNT(*)::int as count FROM job_application WHERE job_id = $1',
        [jobId],
      ),
      this.repository.query(
        'SELECT status, COUNT(*)::int as count FROM job_application WHERE job_id = $1 GROUP BY status',
        [jobId],
      ),
      this.repository.query(
        'SELECT ROUND(AVG(ai_score)::numeric, 2) as avg FROM job_application WHERE job_id = $1 AND ai_score IS NOT NULL',
        [jobId],
      ),
      this.repository.query(
        `SELECT app.id as applicationId,
                  u.id as "userId",
                  u.full_name as name,
                  u.email as email,
                  u.gender as gender,
                  app.ai_score as ai_score
           FROM job_application app
           JOIN users u ON u.id = app.user_id
           WHERE app.job_id = $1 AND app.ai_score IS NOT NULL
           ORDER BY app.ai_score DESC
           LIMIT 5`,
        [jobId],
      ),
      this.repository.query(
        `SELECT COALESCE(u.gender::text, 'UNKNOWN') as gender, COUNT(*)::int as count
           FROM job_application app
           JOIN users u ON u.id = app.user_id
           WHERE app.job_id = $1
           GROUP BY COALESCE(u.gender::text, 'UNKNOWN')`,
        [jobId],
      ),
      this.repository.query(
        `SELECT bucket, COUNT(*)::int as count FROM (
              SELECT CASE
                       WHEN u.dob IS NULL THEN 'Unknown'
                       WHEN EXTRACT(YEAR FROM AGE(u.dob)) < 18 THEN 'Under 18'
                       WHEN EXTRACT(YEAR FROM AGE(u.dob)) BETWEEN 18 AND 24 THEN '18-24'
                       WHEN EXTRACT(YEAR FROM AGE(u.dob)) BETWEEN 25 AND 34 THEN '25-34'
                       WHEN EXTRACT(YEAR FROM AGE(u.dob)) BETWEEN 35 AND 44 THEN '35-44'
                       WHEN EXTRACT(YEAR FROM AGE(u.dob)) BETWEEN 45 AND 54 THEN '45-54'
                       ELSE '55+'
                     END as bucket
              FROM job_application app
              JOIN users u ON u.id = app.user_id
              WHERE app.job_id = $1
           ) t
           GROUP BY bucket`,
        [jobId],
      ),
      this.repository.query(
        `SELECT COALESCE(cp.location, 'Unknown') as location, COUNT(*)::int as count
           FROM job_application app
           LEFT JOIN candidate_profile cp ON cp.user_id = app.user_id
           WHERE app.job_id = $1
           GROUP BY cp.location
           ORDER BY count DESC
           LIMIT 20`,
        [jobId],
      ),
    ]);

    const totalApplications: number = totalAppsRaw?.[0]?.count || 0;
    const applicationsByStatus: Record<string, number> = {};
    for (const row of statusCountsRaw || []) {
      applicationsByStatus[row.status] = Number(row.count) || 0;
    }

    const averageAiScore: number = avgScoreRaw?.[0]?.avg
      ? parseFloat(avgScoreRaw[0].avg)
      : 0;

    const topCandidatesByAiScore: TopCandidateDto[] = (
      topCandidatesRaw || []
    ).map((r: any) => ({
      applicationId: Number(r.applicationid || r.applicationId),
      userId: Number(r.userId || r.userid),
      name: r.name,
      email: r.email,
      gender: r.gender ?? null,
      ai_score: Number(r.ai_score),
    }));

    const genderStats: Record<string, number> = {};
    for (const r of genderRaw || []) {
      const key = r.gender || 'UNKNOWN';
      genderStats[key] = Number(r.count) || 0;
    }

    const ageStats: Record<string, number> = {};
    for (const r of ageBucketsRaw || []) {
      ageStats[r.bucket] = Number(r.count) || 0;
    }

    const locationStats: Array<{ location: string; count: number }> = (
      locationsRaw || []
    ).map((r: any) => ({
      location: r.location || 'Unknown',
      count: Number(r.count) || 0,
    }));

    const now = new Date();
    const deadlineMs = new Date(job.deadline).getTime();
    const daysUntilDeadline = Math.ceil(
      (deadlineMs - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    const response: JobStatisticsResponseDto = {
      jobId: job.id,
      title: job.title,
      createdAt: job.createdAt.toISOString(),
      deadline: job.deadline.toISOString(),
      isExpired: deadlineMs < now.getTime(),
      daysUntilDeadline,
      totalApplications,
      applicationsByStatus,
      averageAiScore,
      topCandidatesByAiScore,
      demographics: {
        gender: genderStats,
        age: ageStats,
        location: locationStats,
      },
    };

    return response;
  }

  async findAll(
    actor: Actor | null,
    limit: number,
    offset: number,
  ): Promise<{ jobs: JobResponseDto[]; count: number }> {
    // For public routes, skip ACL check
    if (actor) {
      await this.aclService.canList();
    }

    // Update priority positions for expired VIP jobs
    await this.updatePriorityForExpiredVipJobs();

    const [jobs, count] = await this.repository.findAndCount({
      where: { isDeleted: false },
      take: limit,
      skip: offset,
      relations: ['company', 'category', 'skills'],
      order: { priorityPosition: 'ASC', createdAt: 'DESC' },
    });

    return {
      jobs: jobs.map((job) => JobMapper.toListJobResponse(job)),
      count,
    };
  }

  // New method to update priority positions for expired VIP jobs
  private async updatePriorityForExpiredVipJobs(): Promise<void> {
    try {
      // Temporarily disable VIP status check until the function is created in database
      // await this.repository.query('SELECT check_vip_status()');
      // this.logger.log('VIP status check temporarily disabled');
    } catch (error) {
      // Create a minimal RequestContext for logging
      const ctx = new RequestContext();
      ctx.requestID = 'system';
      ctx.url = 'job-service';
      ctx.user = null;

      this.logger.error(
        ctx,
        'Failed to update priority for expired VIP jobs',
        error instanceof Error ? error.stack : undefined,
        { error: error instanceof Error ? error.message : String(error) },
      );
    }
  }

  async findJobsByCompany(
    companyId: string,
    limit: number,
    offset: number,
  ): Promise<{ jobs: JobResponseDto[]; count: number }> {
    // Update priority positions for expired VIP jobs
    await this.updatePriorityForExpiredVipJobs();

    const [jobs, count] = await this.repository.findAndCount({
      where: { company: { id: companyId }, isDeleted: false },
      take: limit,
      skip: offset,
      relations: ['company', 'category', 'skills'],
      order: { priorityPosition: 'ASC', createdAt: 'DESC' },
    });

    // Don't throw error if no jobs found, just return empty array
    // This is normal behavior after deleting jobs

    return {
      jobs: jobs.map((job) => JobMapper.toListJobResponse(job)),
      count,
    };
  }

  async findJobsByCompanyForHr(
    actor: Actor,
    companyId: string,
    limit: number,
    offset: number,
  ): Promise<{ jobs: HrJobResponseDto[]; count: number }> {
    // Check if user has permission to view company jobs
    await this.aclService.canList();

    // Update priority positions for expired VIP jobs
    await this.updatePriorityForExpiredVipJobs();

    const queryBuilder = this.repository
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.company', 'company')
      .leftJoin('job_application', 'application', 'application.job_id = job.id')
      .addSelect('COUNT(application.id)', 'totalApplications')
      .where('company.id = :companyId', { companyId })
      .andWhere('job.isDeleted = :isDeleted', { isDeleted: false })
      .groupBy('job.id')
      .addGroupBy('company.id')
      .orderBy('job.createdAt', 'DESC');

    // Get total count without pagination
    const totalCount = await queryBuilder.getCount();

    // Apply pagination
    const jobs = await queryBuilder
      .skip(offset)
      .take(limit)
      .getRawAndEntities();

    // Don't throw error if no jobs found, just return empty array
    // This is normal behavior after deleting jobs

    const jobData = jobs.entities.map((job, index) => ({
      jobId: job.id,
      jobTitle: job.title,
      status: job.status === 'OPEN' ? 'Open' : 'Closed',
      postedDate: job.createdAt.toISOString().split('T')[0],
      endDate: job.deadline.toISOString().split('T')[0],
      jobType: this.formatJobType(job.typeOfEmployment),
      totalApplications: parseInt(
        jobs.raw[index]?.totalApplications || '0',
        10,
      ),
    }));

    return {
      jobs: jobData,
      count: totalCount,
    };
  }

  private formatJobType(typeOfEmployment: string): string {
    const typeMapping: Record<string, string> = {
      FULL_TIME: 'Full-time',
      PART_TIME: 'Part-time',
      CONTRACT: 'Contract',
      INTERNSHIP: 'Internship',
      REMOTE: 'Remote',
      FREELANCE: 'Freelance',
      TEMPORARY: 'Temporary',
      VOLUNTEER: 'Volunteer',
      APPRENTICESHIP: 'Apprenticeship',
      CO_OP: 'Co-op',
      SEASONAL: 'Seasonal',
      ONSITE: 'On-site',
      HYBRID: 'Hybrid',
    };
    return typeMapping[typeOfEmployment] || typeOfEmployment;
  }

  async create(
    actor: Actor,
    dto: CreateJobReqDto,
  ): Promise<JobDetailResponseDto> {
    const category = await this.categoryRepository.findOne({
      where: { id: dto.categoryId },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Fetch skills if skillIds are provided
    let skills: Skill[] = [];
    if (dto.skillIds && dto.skillIds.length > 0) {
      skills = await this.skillRepository.findByIds(dto.skillIds);
      if (skills.length !== dto.skillIds.length) {
        throw new NotFoundException('One or more skills not found');
      }
    }

    // If VIP expiration date is provided, validate it's in the future
    if (dto.vipExpired) {
      const vipExpiredDate = new Date(dto.vipExpired);
      const now = new Date();

      if (vipExpiredDate <= now) {
        throw new BadRequestException(
          'VIP expiration date must be in the future',
        );
      }
    }

    // Priority position will be set by the database trigger based on vipExpired

    const jobData = {
      ...dto,
      category,
      company: { id: dto.companyId },
      skills,
    };

    const job = await this.repository.save(jobData);
    return JobMapper.toResponse(job);
  }

  async findOne(
    actor: Actor | null,
    id: string,
  ): Promise<JobDetailResponseDto> {
    // For public routes, skip ACL check
    if (actor) {
      await this.aclService.canView();
    }

    const job = await this.repository.findOne({
      where: { id, isDeleted: false },
      relations: ['company', 'category', 'skills'],
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    return JobMapper.toResponse(job);
  }

  async update(
    actor: Actor,
    id: string,
    dto: Partial<CreateJobReqDto>,
  ): Promise<JobDetailResponseDto> {
    const job = await this.repository.findOne({
      where: { id, isDeleted: false },
      relations: ['company', 'company.users', 'category', 'skills'],
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    // Debug logging for ACL check
    const ctx = new RequestContext();
    ctx.requestID = 'job-update';
    ctx.url = 'job-service';
    ctx.user = null;

    this.logger.log(
      ctx,
      `ACL check for job ${job.id}: actor=${actor.id}, roles=${actor.roles.join(',')}, companyUsers=${job.company?.users?.length || 0}, companyId=${job.company?.id || 'null'}`,
    );

    // Debug company users details
    if (job.company?.users) {
      this.logger.log(
        ctx,
        `Company users: ${job.company.users.map((u) => u.id).join(',')}`,
      );
    } else {
      this.logger.log(ctx, 'Company users is null or undefined');
    }

    if (!this.aclService.forActor(actor).canDoAction(Action.Update, job)) {
      this.logger.error(
        ctx,
        `ACL check failed for job ${job.id}: actor=${actor.id}, roles=${actor.roles.join(',')}`,
      );
      throw new UnauthorizedException();
    }

    // Check if job can be modified (within 24 hours of creation)
    const now = new Date();
    const createdAt = new Date(job.createdAt);
    const timeDiff = now.getTime() - createdAt.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);

    if (hoursDiff > 24) {
      throw new BadRequestException(
        'Job can only be modified within 24 hours of creation',
      );
    }

    // Update category if categoryId is provided
    if (dto.categoryId) {
      const category = await this.categoryRepository.findOne({
        where: { id: dto.categoryId },
      });
      if (!category) {
        throw new NotFoundException('Category not found');
      }
      job.category = category;
    }

    // Update skills if skillIds are provided
    if (dto.skillIds) {
      const skills = await this.skillRepository.findByIds(dto.skillIds);
      if (skills.length !== dto.skillIds.length) {
        throw new NotFoundException('One or more skills not found');
      }
      job.skills = skills;
    }

    // If VIP expiration date is provided, validate it's in the future
    if (dto.vipExpired) {
      const vipExpiredDate = new Date(dto.vipExpired);
      const now = new Date();

      if (vipExpiredDate <= now) {
        throw new BadRequestException(
          'VIP expiration date must be in the future',
        );
      }

      // If updating vipExpired to a future date, also update priority position
      if (dto.priorityPosition === undefined) {
        dto.priorityPosition = 1; // Default to highest priority for VIP jobs
      }
    }

    // Extract fields from DTO
    const {
      title,
      description,
      location,
      salaryMin,
      salaryMax,
      experienceYears,
      deadline,
      benefit,
      vipExpired,
      typeOfEmployment,
      priorityPosition,
      topJob,
    } = dto;

    // Create update object with only the fields that exist in the entity
    const updateData: any = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (location !== undefined) updateData.location = location;
    if (salaryMin !== undefined) updateData.salaryMin = salaryMin;
    if (salaryMax !== undefined) updateData.salaryMax = salaryMax;
    if (experienceYears !== undefined)
      updateData.experienceYears = experienceYears;
    if (deadline !== undefined) updateData.deadline = deadline;
    if (benefit !== undefined) updateData.benefit = benefit;
    if (vipExpired !== undefined) updateData.vipExpired = vipExpired;
    if (typeOfEmployment !== undefined)
      updateData.typeOfEmployment = typeOfEmployment;
    if (priorityPosition !== undefined)
      updateData.priorityPosition = priorityPosition;
    if (topJob !== undefined) updateData.topJob = topJob;

    // Update job with proper typing
    const updated = await this.repository.save({
      ...job,
      ...updateData,
    });

    const result = await this.repository.findOne({
      where: { id: updated.id },
      relations: ['company', 'category', 'skills'],
    });

    if (!result) {
      throw new NotFoundException('Updated job not found');
    }

    return JobMapper.toResponse(result);
  }

  async delete(actor: Actor, id: string): Promise<void> {
    const job = await this.repository.findOne({
      where: { id },
      relations: ['company', 'company.users', 'category', 'skills'],
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (!this.aclService.forActor(actor).canDoAction(Action.Delete, job)) {
      throw new UnauthorizedException();
    }

    // Soft delete: set isDeleted to true instead of removing from database
    job.isDeleted = true;
    await this.repository.save(job);
  }

  /**
   * Get deleted jobs for history purpose
   * This method will be used for future history feature
   */
  async findDeletedJobs(
    actor: Actor,
    limit: number,
    offset: number,
  ): Promise<{ jobs: JobResponseDto[]; count: number }> {
    // Check if user has permission to view deleted jobs
    await this.aclService.canList();

    const [jobs, count] = await this.repository.findAndCount({
      where: { isDeleted: true },
      take: limit,
      skip: offset,
      relations: ['company', 'category', 'skills'],
      order: { updatedAt: 'DESC' },
    });

    return {
      jobs: jobs.map((job) => JobMapper.toListJobResponse(job)),
      count,
    };
  }

  /**
   * Restore a deleted job
   * This method will be used for future restore feature
   */
  async restoreJob(actor: Actor, id: string): Promise<JobDetailResponseDto> {
    const job = await this.repository.findOne({
      where: { id, isDeleted: true },
      relations: ['company', 'company.users', 'category', 'skills'],
    });

    if (!job) {
      throw new NotFoundException('Deleted job not found');
    }

    if (!this.aclService.forActor(actor).canDoAction(Action.Update, job)) {
      throw new UnauthorizedException();
    }

    // Restore job by setting isDeleted to false
    job.isDeleted = false;
    await this.repository.save(job);

    const restoredJob = await this.repository.findOne({
      where: { id },
      relations: ['company', 'category', 'skills'],
    });

    if (!restoredJob) {
      throw new NotFoundException('Restored job not found');
    }

    return JobMapper.toResponse(restoredJob);
  }

  async findTopJobs(
    limit: number,
    offset: number,
  ): Promise<{ jobs: TopJobResponseDto[]; count: number }> {
    const [jobs, count] = await this.repository
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.company', 'company')
      .leftJoinAndSelect('job.category', 'category')
      .leftJoinAndSelect('job.skills', 'skills')
      .where('job.isDeleted = :isDeleted', { isDeleted: false })
      .andWhere('job.topJob > :minTopJob', { minTopJob: 0 })
      .orderBy('job.topJob', 'ASC')
      .addOrderBy('job.createdAt', 'DESC')
      .take(limit)
      .skip(offset)
      .getManyAndCount();

    return {
      jobs: jobs.map((job) => JobMapper.toTopJobResponse(job)),
      count,
    };
  }
}
