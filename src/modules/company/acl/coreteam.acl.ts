import { Injectable } from '@nestjs/common';

import { ROLE } from '@/modules/auth/constants/role.constant';
import { BaseAclService } from '@/shared/acl/acl.service';
import { Action } from '@/shared/acl/action.constant';

import { CoreTeam } from '../entities/coreteam.entity';

@Injectable()
export class CoreTeamAclService extends BaseAclService<CoreTeam> {
  constructor() {
    super();
    this.canDo(ROLE.ADMIN, [Action.Manage]);
    this.canDo(
      ROLE.ADMIN_RECRUITER,
      [Action.Create, Action.Read, Action.Update, Action.Delete],
      this.isCompanyOwner,
    );
    this.canDo(
      ROLE.RECRUITER,
      [Action.Read, Action.Update],
      this.isCompanyOwner,
    );
    this.canDo(ROLE.USER, [Action.Read, Action.List]);
  }

  private isCompanyOwner = (resource: CoreTeam, actor: any): boolean => {
    return resource.company?.user?.id === actor.id;
  };
}
