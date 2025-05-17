import { Injectable } from '@nestjs/common';

import { ROLE } from '@/modules/auth/constants/role.constant';
import { CoreTeam } from '@/modules/company/entities/coreteam.entity';
import { BaseAclService } from '@/shared/acl/acl.service';
import { Action } from '@/shared/acl/action.constant';

@Injectable()
export class CoreTeamAclService extends BaseAclService<CoreTeam> {
  constructor() {
    super();
    this.canDo(ROLE.ADMIN, [Action.Manage]);
    this.canDo(ROLE.ADMIN_RECRUITER, [
      Action.Create,
      Action.Read,
      Action.Update,
      Action.Delete,
    ]);
    this.canDo(ROLE.RECRUITER, [Action.Read, Action.Update]);
    this.canDo(ROLE.USER, [Action.Read, Action.List]);
  }
}
