import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

import { CV } from '../entities/cv.entity';

@Injectable()
export class CvRepository extends Repository<CV> {
  constructor(private dataSource: DataSource) {
    super(CV, dataSource.createEntityManager());
  }

  async findByUserId(userId: number, skip?: number, take?: number): Promise<[CV[], number]> {
    const queryBuilder = this.createQueryBuilder('cv')
      .where('cv.userId = :userId', { userId })
      .orderBy('cv.createdAt', 'DESC')
      .leftJoinAndSelect('cv.user', 'user');

    if (typeof skip === 'number') {
      queryBuilder.skip(skip);
    }
    if (typeof take === 'number') {
      queryBuilder.take(take);
    }

    return queryBuilder.getManyAndCount();
  }
}
