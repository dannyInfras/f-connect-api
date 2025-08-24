import { Injectable } from '@nestjs/common';

import { ROLE } from '@/modules/auth/constants/role.constant';
import { BaseAclService } from '@/shared/acl/acl.service';
import { Action } from '@/shared/acl/action.constant';

@Injectable()
export class CompanySearchAclService extends BaseAclService<any> {
  constructor() {
    super();
    this.canDo(ROLE.ADMIN, [Action.Manage]);
    this.canDo(ROLE.ADMIN_RECRUITER, [Action.Read, Action.List]);
    this.canDo(ROLE.RECRUITER, [Action.Read, Action.List]);
    this.canDo(ROLE.USER, [Action.Read, Action.List]);
  }
}
