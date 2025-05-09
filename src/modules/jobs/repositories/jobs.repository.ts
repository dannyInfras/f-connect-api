import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

import { Job } from '../entities/jobs.entity';

@Injectable()
export class JobRepository extends Repository<Job> {
  constructor(private dataSource: DataSource) {
    super(Job, dataSource.createEntityManager());
  }

  async getById(id: string): Promise<Job> {
    const job = await this.findOne({
      where: { id },
      relations: ['company', 'categories', 'company.user'],
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    return job;
  }

  async getByCategoryId(categoryId: string): Promise<Job[]> {
    return this.createQueryBuilder('job')
      .leftJoinAndSelect('job.categories', 'category')
      .where('category.id = :categoryId', { categoryId })
      .getMany();
  }
}
