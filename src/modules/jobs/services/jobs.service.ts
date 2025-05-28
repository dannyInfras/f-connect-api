import {
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

import { CreateJobReqDto } from '../dtos/req/create-job.req';
import { JobDetailResponseDto } from '../dtos/res/job.res';
import { JobResponseDto } from '../dtos/res/list-job.res';
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

  async findAll(
    actor: Actor | null,
    limit: number,
    offset: number,
  ): Promise<{ jobs: JobResponseDto[]; count: number }> {
    // For public routes, skip ACL check
    if (actor) {
      await this.aclService.canList();
    }

    const [jobs, count] = await this.repository.findAndCount({
      take: limit,
      skip: offset,
      relations: ['company', 'category', 'skills'],
      order: { createdAt: 'DESC' },
    });

    return {
      jobs: jobs.map((job) => JobMapper.toListJobResponse(job)),
      count,
    };
  }

  async findJobsByCompany(
    companyId: string,
    limit: number,
    offset: number,
  ): Promise<{ jobs: JobResponseDto[]; count: number }> {
    const [jobs, count] = await this.repository.findAndCount({
      where: { company: { id: companyId } },
      take: limit,
      skip: offset,
      relations: ['company', 'category', 'skills'],
      order: { createdAt: 'DESC' },
    });

    if (!jobs.length) {
      throw new NotFoundException('No jobs found for this company');
    }

    return {
      jobs: jobs.map((job) => JobMapper.toListJobResponse(job)),
      count,
    };
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
      where: { id },
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
      where: { id },
      relations: ['company', 'category', 'skills'],
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (!this.aclService.forActor(actor).canDoAction(Action.Update, job)) {
      throw new UnauthorizedException();
    }

    // Update skills if skillIds are provided
    if (dto.skillIds) {
      const skills = await this.skillRepository.findByIds(dto.skillIds);
      if (skills.length !== dto.skillIds.length) {
        throw new NotFoundException('One or more skills not found');
      }
      job.skills = skills;
    }

    // Update job with proper typing
    const updated = await this.repository.save({
      ...job,
      ...dto,
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
      relations: ['company', 'company.user', 'category', 'skills'],
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (!this.aclService.forActor(actor).canDoAction(Action.Delete, job)) {
      throw new UnauthorizedException();
    }

    await this.repository.remove(job);
  }
}
