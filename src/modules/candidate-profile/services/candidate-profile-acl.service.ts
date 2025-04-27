import { Injectable } from '@nestjs/common';

import { ROLE } from '@/modules/auth/constants/role.constant';
import { CandidateProfile } from '@/modules/candidate-profile/entities/candidate-profile.entity';
import { BaseAclService } from '@/shared/acl/acl.service';
import { Action } from '@/shared/acl/action.constant';
import { Actor } from '@/shared/acl/actor.constant';

@Injectable()
export class CandidateProfileAclService extends BaseAclService<CandidateProfile> {
  constructor() {
    super();
    this.canDo(ROLE.ADMIN, [Action.Manage]);
    this.canDo(ROLE.USER, [Action.Create, Action.List, Action.Read]);
    this.canDo(ROLE.USER, [Action.Update, Action.Delete], this.isProfileOwner);
  }

  isProfileOwner(resource: CandidateProfile, actor: Actor): boolean {
    return resource.user?.id === actor.id;
  }
}
