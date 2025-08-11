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
      where: { id, isDeleted: false },
      relations: ['company', 'category', 'company.users'],
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    return job;
  }

  async getByCategoryId(categoryId: string): Promise<Job[]> {
    return this.createQueryBuilder('job')
      .leftJoinAndSelect('job.category', 'category')
      .where('category.id = :categoryId', { categoryId })
      .andWhere('job.isDeleted = :isDeleted', { isDeleted: false })
      .getMany();
  }
}
