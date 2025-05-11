import { Injectable } from '@nestjs/common';

import { ROLE } from '@/modules/auth/constants/role.constant';
import { Education } from '@/modules/candidate-profile/entities/education.entity';
import { BaseAclService } from '@/shared/acl/acl.service';
import { Action } from '@/shared/acl/action.constant';
import { Actor } from '@/shared/acl/actor.constant';

@Injectable()
export class EducationAclService extends BaseAclService<Education> {
  constructor() {
    super();
    this.canDo(ROLE.ADMIN, [Action.Manage]);
    this.canDo(ROLE.ADMIN, [Action.Create], this.isEducationOwner);
    this.canDo(ROLE.USER, [Action.Create, Action.List, Action.Read]);
    this.canDo(
      ROLE.USER,
      [Action.Update, Action.Delete],
      this.isEducationOwner,
    );
  }

  isEducationOwner(resource: Education, actor: Actor): boolean {
    return resource.candidateProfile?.user?.id === actor.id;
  }
}
