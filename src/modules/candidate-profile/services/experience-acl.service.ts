import { Injectable } from '@nestjs/common';

import { ROLE } from '@/modules/auth/constants/role.constant';
import { Experience } from '@/modules/candidate-profile/entities/experience.entity';
import { BaseAclService } from '@/shared/acl/acl.service';
import { Action } from '@/shared/acl/action.constant';
import { Actor } from '@/shared/acl/actor.constant';

@Injectable()
export class ExperienceAclService extends BaseAclService<Experience> {
  constructor() {
    super();
    this.canDo(ROLE.ADMIN, [Action.Manage]);
    this.canDo(ROLE.USER, [Action.Create, Action.List, Action.Read]);
    this.canDo(
      ROLE.USER,
      [Action.Update, Action.Delete],
      this.isExperienceOwner,
    );
  }

  isExperienceOwner(resource: Experience, actor: Actor): boolean {
    return resource.candidateProfile?.user?.id === actor.id;
  }
}
