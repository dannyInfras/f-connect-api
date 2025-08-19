import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

import { CompanyCvChecklist } from '../entities/company-cv-checklist.entity';

@Injectable()
export class CompanyCvChecklistRepository extends Repository<CompanyCvChecklist> {
  constructor(dataSource: DataSource) {
    super(CompanyCvChecklist, dataSource.createEntityManager());
  }

  /**
   * Find active checklists for a company
   */
  async findActiveByCompanyId(
    companyId: string,
  ): Promise<CompanyCvChecklist[]> {
    return this.find({
      where: {
        companyId,
        isActive: true,
      },
      order: {
        isDefault: 'DESC',
        createdAt: 'ASC',
      },
    });
  }

  /**
   * Find the default checklist for a company
   */
  async findDefaultByCompanyId(
    companyId: string,
  ): Promise<CompanyCvChecklist | null> {
    return this.findOne({
      where: {
        companyId,
        isDefault: true,
        isActive: true,
      },
    });
  }

  /**
   * Find checklist by ID for a specific company
   */
  async findByIdAndCompanyId(
    id: number,
    companyId: string,
  ): Promise<CompanyCvChecklist | null> {
    return this.findOne({
      where: {
        id,
        companyId,
      },
    });
  }

  /**
   * Update default checklist (ensure only one default per company)
   */
  async updateDefaultChecklist(
    newDefaultId: number,
    companyId: string,
  ): Promise<void> {
    await this.manager.transaction(async (manager) => {
      // First, remove default from all other checklists for this company
      await manager.update(
        CompanyCvChecklist,
        {
          companyId,
          isDefault: true,
        },
        { isDefault: false },
      );

      // Set the new default
      await manager.update(
        CompanyCvChecklist,
        {
          id: newDefaultId,
          companyId,
        },
        { isDefault: true, isActive: true },
      );
    });
  }
}
