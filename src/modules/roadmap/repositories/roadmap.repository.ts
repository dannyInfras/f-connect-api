import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

import { Roadmap } from '../entities/roadmap.entity';

@Injectable()
export class RoadmapRepository extends Repository<Roadmap> {
  constructor(private dataSource: DataSource) {
    super(Roadmap, dataSource.createEntityManager());
  }

  async findByUserId(
    userId: number,
    limit: number,
    offset: number,
  ): Promise<[Roadmap[], number]> {
    return this.findAndCount({
      where: { userId },
      take: limit,
      skip: offset,
      order: { createdAt: 'DESC' },
    });
  }
} 