import { Injectable } from '@nestjs/common';

import { ROLE } from '@/modules/auth/constants/role.constant';
import { Benefit } from '@/modules/company/entities/benefit.entity';
import { BaseAclService } from '@/shared/acl/acl.service';
import { Action } from '@/shared/acl/action.constant';
@Injectable()
export class BenefitAclService extends BaseAclService<Benefit> {
  constructor() {
    super();
    this.canDo(ROLE.ADMIN, [Action.Manage]);
    this.canDo(ROLE.ADMIN_RECRUITER, [
      Action.Create,
      Action.Read,
      Action.Update,
      Action.Delete,
    ]);
    this.canDo(ROLE.RECRUITER, [
      Action.Create,
      Action.Read,
      Action.Update,
      Action.Delete,
    ]);
    this.canDo(ROLE.USER, [Action.Read, Action.List]);
  }
}
