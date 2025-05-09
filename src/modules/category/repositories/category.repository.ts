import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

import { Category } from '../entities/category.entity';

@Injectable()
export class CategoryRepository extends Repository<Category> {
  constructor(private dataSource: DataSource) {
    super(Category, dataSource.createEntityManager());
  }

  async getById(id: string): Promise<Category> {
    const category = await this.findOne({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async getByName(name: string): Promise<Category | null> {
    return this.findOne({
      where: { name },
    });
  }
}
