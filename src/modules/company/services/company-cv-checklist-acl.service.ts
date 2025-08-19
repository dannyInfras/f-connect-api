import { Injectable } from '@nestjs/common';

import { ROLE } from '@/modules/auth/constants/role.constant';
import { BaseAclService } from '@/shared/acl/acl.service';
import { Action } from '@/shared/acl/action.constant';
import { Actor } from '@/shared/acl/actor.constant';

import { CompanyCvChecklist } from '../entities/company-cv-checklist.entity';

interface CompanyCvChecklistActor extends Actor {
  companyId?: string | number;
}

@Injectable()
export class CompanyCvChecklistAclService extends BaseAclService<CompanyCvChecklist> {
  constructor() {
    super();

    // Admin can manage all checklists
    this.canDo(ROLE.ADMIN, [Action.Manage]);

    // Company HR can manage their company's checklists
    this.canDo(
      ROLE.ADMIN_RECRUITER,
      [Action.Create, Action.Read, Action.Update, Action.Delete, Action.List],
      this.isCompanyChecklist,
    );

    // Regular company users can only read their company's checklists
    this.canDo(
      ROLE.RECRUITER,
      [Action.Read, Action.List],
      this.isCompanyChecklist,
    );
  }

  /**
   * Check if the checklist belongs to the actor's company
   */
  isCompanyChecklist(
    resource: CompanyCvChecklist,
    actor: CompanyCvChecklistActor,
  ): boolean {
    // Get company ID from JWT token or company object
    const userCompanyId = actor.companyId?.toString();
    if (!userCompanyId) {
      return false;
    }

    return userCompanyId === resource.companyId.toString();
  }

  /**
   * Check if the actor can create checklists for their company
   */
  canCreateForCompany(
    companyId: string,
    actor: CompanyCvChecklistActor,
  ): boolean {
    // Get company ID from JWT token or company object
    const userCompanyId = actor.companyId?.toString();
    if (!userCompanyId) {
      return false;
    }

    return userCompanyId === companyId.toString();
  }
}
