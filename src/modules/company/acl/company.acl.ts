// src/modules/company/acl/company.acl.ts
import { Injectable } from '@nestjs/common';

import { ROLE } from '@/modules/auth/constants/role.constant';
import { BaseAclService } from '@/shared/acl/acl.service';
import { Action } from '@/shared/acl/action.constant';

import { Company } from '../entities/company.entity';

@Injectable()
export class CompanyAclService extends BaseAclService<Company> {
  constructor() {
    super();
    this.canDo(ROLE.ADMIN, [Action.Manage]);
    this.canDo(ROLE.USER, [Action.Create, Action.Read, Action.Update], this.isCompanyOwner);
  }

  private isCompanyOwner = (resource: Company, actor: any): boolean => {
    return resource.user?.id === actor.id;
  };
}
