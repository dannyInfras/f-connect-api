import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { Action } from '@/shared/acl/action.constant';
import { Actor } from '@/shared/acl/actor.constant';

import { CreateCvChecklistReqDto } from '../dtos/req/create-cv-checklist.req';
import { UpdateCvChecklistReqDto } from '../dtos/req/update-cv-checklist.req';
import { CompanyCvChecklist } from '../entities/company-cv-checklist.entity';
import { CompanyCvChecklistRepository } from '../repositories/company-cv-checklist.repository';
import { CompanyCvChecklistAclService } from './company-cv-checklist-acl.service';

@Injectable()
export class CompanyCvChecklistService {
  constructor(
    private readonly checklistRepository: CompanyCvChecklistRepository,
    private readonly aclService: CompanyCvChecklistAclService,
  ) {}

  /**
   * Create a new CV checklist for a company
   */
  async createChecklist(
    companyId: string,
    createDto: CreateCvChecklistReqDto,
    actor: Actor,
  ): Promise<CompanyCvChecklist> {
    if (!this.aclService.canCreateForCompany(companyId, actor)) {
      throw new UnauthorizedException(
        'Cannot create checklist for this company',
      );
    }

    // Check if setting as default but another default exists
    if (createDto.isDefault) {
      const existingDefault =
        await this.checklistRepository.findDefaultByCompanyId(companyId);
      if (existingDefault) {
        throw new ConflictException(
          'A default checklist already exists for this company',
        );
      }
    }

    const checklist = this.checklistRepository.create({
      ...createDto,
      companyId,
    });

    return this.checklistRepository.save(checklist);
  }

  /**
   * Get all checklists for a company
   */
  async findByCompanyId(
    companyId: string,
    actor: Actor,
  ): Promise<CompanyCvChecklist[]> {
    if (!this.aclService.canCreateForCompany(companyId, actor)) {
      throw new UnauthorizedException(
        'Cannot access checklists for this company',
      );
    }

    return this.checklistRepository.findActiveByCompanyId(companyId);
  }

  /**
   * Get the default checklist for a company
   */
  async findDefaultByCompanyId(
    companyId: string,
  ): Promise<CompanyCvChecklist | null> {
    return this.checklistRepository.findDefaultByCompanyId(companyId);
  }

  /**
   * Get a specific checklist by ID
   */
  async findById(id: number, actor: Actor): Promise<CompanyCvChecklist> {
    const checklist = await this.checklistRepository.findOne({
      where: { id },
    });

    if (!checklist) {
      throw new NotFoundException('Checklist not found');
    }

    if (!this.aclService.forActor(actor).canDoAction(Action.Read, checklist)) {
      throw new UnauthorizedException('Cannot access this checklist');
    }

    return checklist;
  }

  /**
   * Update a checklist
   */
  async updateChecklist(
    id: number,
    updateDto: UpdateCvChecklistReqDto,
    actor: Actor,
  ): Promise<CompanyCvChecklist> {
    const checklist = await this.findById(id, actor);

    if (
      !this.aclService.forActor(actor).canDoAction(Action.Update, checklist)
    ) {
      throw new UnauthorizedException('Cannot update this checklist');
    }

    // Handle default checklist logic
    if (updateDto.isDefault && !checklist.isDefault) {
      await this.checklistRepository.updateDefaultChecklist(
        id,
        checklist.companyId,
      );
      // Fetch updated record
      return this.findById(id, actor);
    }

    Object.assign(checklist, updateDto);
    return this.checklistRepository.save(checklist);
  }

  /**
   * Delete a checklist
   */
  async deleteChecklist(id: number, actor: Actor): Promise<void> {
    const checklist = await this.findById(id, actor);

    if (
      !this.aclService.forActor(actor).canDoAction(Action.Delete, checklist)
    ) {
      throw new UnauthorizedException('Cannot delete this checklist');
    }

    if (checklist.isDefault) {
      throw new ConflictException('Cannot delete the default checklist');
    }

    await this.checklistRepository.remove(checklist);
  }

  /**
   * Set a checklist as default for the company
   */
  async setAsDefault(id: number, actor: Actor): Promise<CompanyCvChecklist> {
    const checklist = await this.findById(id, actor);

    if (
      !this.aclService.forActor(actor).canDoAction(Action.Update, checklist)
    ) {
      throw new UnauthorizedException('Cannot update this checklist');
    }

    await this.checklistRepository.updateDefaultChecklist(
      id,
      checklist.companyId,
    );
    return this.findById(id, actor);
  }

  /**
   * Get checklist for CV analysis (used by Python worker)
   * This method bypasses ACL checks as it's used internally
   */
  async getChecklistForAnalysis(
    companyId: string,
  ): Promise<CompanyCvChecklist | null> {
    return this.checklistRepository.findDefaultByCompanyId(companyId);
  }
}
