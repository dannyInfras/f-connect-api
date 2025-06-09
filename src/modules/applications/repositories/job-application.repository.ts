import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOneOptions, Repository } from 'typeorm';

import { User } from '../../user/entities/user.entity';
import { JobApplicationResponseDto } from '../dtos/job-appication-response.dto';
import { JobApplication } from '../entities/job-application.entity';
import {
  ApplicationsWithCount,
  FindByJobIdParams,
  FindByUserIdParams,
} from '../types';

@Injectable()
export class JobApplicationRepository {
  constructor(
    @InjectRepository(JobApplication)
    private readonly repo: Repository<JobApplication>,
  ) {}

  async save(application: JobApplication): Promise<JobApplication> {
    return this.repo.save(application);
  }

  async findOne(
    options: FindOneOptions<JobApplication>,
  ): Promise<JobApplication | null> {
    return this.repo.findOne(options);
  }

  async findByUserId(
    params: FindByUserIdParams,
  ): Promise<ApplicationsWithCount> {
    const { userId, limit, offset } = params;

    const query = this.repo
      .createQueryBuilder('application')
      .leftJoinAndSelect('application.user', 'user')
      .leftJoinAndSelect('application.job', 'job')
      .leftJoinAndSelect('job.company', 'company')
      .where('application.user_id = :userId', { userId });

    const [applications, count] = await Promise.all([
      query.take(limit).skip(offset).getMany(),
      query.getCount(),
    ]);

    return {
      applications: applications.map((application) =>
        this.toResponseDto(application),
      ),
      count,
    };
  }

  async findByJobId(params: FindByJobIdParams): Promise<ApplicationsWithCount> {
    const { jobId, limit, offset } = params;

    const query = this.repo
      .createQueryBuilder('application')
      .leftJoinAndSelect('application.user', 'user')
      .where({ job: { id: jobId } });

    const [applications, count] = await Promise.all([
      query.take(limit).skip(offset).getMany(),
      query.getCount(),
    ]);

    return {
      applications: applications.map((application) =>
        this.toResponseDto(application),
      ),
      count,
    };
  }

  private toResponseDto(
    application: JobApplication,
  ): JobApplicationResponseDto {
    return {
      id: application.id.toString(),
      user: {
        id: application.user.id,
      } as User,
      job: application.job,
      company: application.job.company,
      status: application.status,
      cv_id: application.cv_id,
      cover_letter: application.cover_letter,
      applied_at: application.applied_at,
      updated_at: application.updated_at,
    };
  }
}
