import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';

@Injectable()
export class UnitOfWork {
  constructor(private readonly dataSource: DataSource) {}

  async doTransactional<T>(
    work: (manager: EntityManager) => Promise<T>,
  ): Promise<T> {
    return await this.dataSource.transaction(async (manager) => {
      try {
        return await work(manager);
      } catch (error) {
        console.log(`Transaction failed: ${error}`);
        throw error;
      }
    });
  }
}
