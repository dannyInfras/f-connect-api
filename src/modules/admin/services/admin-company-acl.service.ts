import { Injectable } from '@nestjs/common';

import { ROLE } from '@/modules/auth/constants/role.constant';
import { Company } from '@/modules/company/entities/company.entity';
import { BaseAclService } from '@/shared/acl/acl.service';
import { Action } from '@/shared/acl/action.constant';

@Injectable()
export class AdminCompanyAclService extends BaseAclService<Company> {
  constructor() {
    super();
    this.canDo(ROLE.ADMIN, [Action.Manage]);
  }
}
