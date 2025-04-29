import { Injectable } from '@nestjs/common';

import { ROLE } from '@/modules/auth/constants/role.constant';
import { Skill } from '@/modules/candidate-profile/entities/skill.entity';
import { BaseAclService } from '@/shared/acl/acl.service';
import { Action } from '@/shared/acl/action.constant';

@Injectable()
export class SkillAclService extends BaseAclService<Skill> {
  constructor() {
    super();
    this.canDo(ROLE.ADMIN, [Action.Manage]);
    this.canDo(ROLE.USER, [Action.Read]);
    this.canDo(ROLE.ADMIN, [Action.Create, Action.Update, Action.Delete]);
  }
}
