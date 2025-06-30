import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

import { Package } from '@/modules/package/entities/package.entity';

@Injectable()
export class PackageRepository extends Repository<Package> {
  constructor(private dataSource: DataSource) {
    super(Package, dataSource.createEntityManager());
  }

  async getById(id: number): Promise<Package> {
    const package_ = await this.findOne({ where: { id } });
    if (!package_) {
      throw new NotFoundException();
    }

    return package_;
  }
}
