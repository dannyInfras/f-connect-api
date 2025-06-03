import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { JobApplication } from '../entities/job-application.entity';

@Injectable()
export class JobApplicationRepository {
  constructor(
    @InjectRepository(JobApplication)
    private readonly repo: Repository<JobApplication>,
  ) {}

  async save(application: JobApplication): Promise<JobApplication> {
    return this.repo.save(application);
  }

  async findOne(options: any): Promise<JobApplication | null> {
    return this.repo.findOne(options);
  }

  async findByUserId(userId: number): Promise<JobApplication[]> {
    return this.repo
      .createQueryBuilder('application')
      .leftJoinAndSelect('application.job', 'job')
      .where('application.user_id = :userId', { userId })
      .getMany();
  }

  async findByJobId(jobId: number): Promise<JobApplication[]> {
    return this.repo
      .createQueryBuilder('application')
      .leftJoinAndSelect('application.user', 'user')
      .where('application.job_id = :jobId', { jobId })
      .getMany();
  }
}
