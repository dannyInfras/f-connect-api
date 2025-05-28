// src/modules/company/acl/company.acl.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';

import { ROLE } from '@/modules/auth/constants/role.constant';
import { BaseAclService } from '@/shared/acl/acl.service';
import { Action } from '@/shared/acl/action.constant';
import { Actor } from '@/shared/acl/actor.constant';

import { Company } from '../entities/company.entity';

@Injectable()
export class CompanyAclService extends BaseAclService<Company> {
  constructor() {
    super();
    // Admin can do everything
    this.canDo(ROLE.ADMIN, [Action.Manage]);

    // Recruiters (both admin and regular) can perform CRUD operations on their own companies
    this.canDo(
      ROLE.ADMIN_RECRUITER,
      [Action.Create, Action.Update, Action.Delete],
      this.isCompanyOwner,
    );
    this.canDo(
      ROLE.RECRUITER,
      [Action.Create, Action.Update, Action.Delete],
      this.isCompanyOwner,
    );

    // Everyone can read and list
    this.canDo(ROLE.ADMIN, [Action.Read, Action.List]);
    this.canDo(ROLE.ADMIN_RECRUITER, [Action.Read, Action.List]);
    this.canDo(ROLE.RECRUITER, [Action.Read, Action.List]);
    this.canDo(ROLE.USER, [Action.Read, Action.List]);
  }

  private isCompanyOwner = (resource: Company, actor: Actor): boolean => {
    return resource.users?.some((user) => user.id === actor.id);
  };

  async canView(): Promise<void> {
    // Everyone can view companies
    return;
  }

  async canList(): Promise<void> {
    // Everyone can list companies
    return;
  }

  async canCreate(actor: Actor): Promise<void> {
    if (!this.forActor(actor).canDoAction(Action.Create)) {
      throw new UnauthorizedException(
        'You do not have permission to create a company',
      );
    }
  }

  async canUpdate(actor: Actor, company: Company): Promise<void> {
    if (!this.forActor(actor).canDoAction(Action.Update, company)) {
      throw new UnauthorizedException(
        'You do not have permission to update this company',
      );
    }
  }

  async canDelete(actor: Actor, company: Company): Promise<void> {
    if (!this.forActor(actor).canDoAction(Action.Delete, company)) {
      throw new UnauthorizedException(
        'You do not have permission to delete this company',
      );
    }
  }
}
