import { Injectable } from '@nestjs/common';

import { ROLE } from '@/modules/auth/constants/role.constant';
import { CandidateSkill } from '@/modules/candidate-profile/entities/candidate-skill.entity';
import { BaseAclService } from '@/shared/acl/acl.service';
import { Action } from '@/shared/acl/action.constant';
import { Actor } from '@/shared/acl/actor.constant';

@Injectable()
export class CandidateSkillAclService extends BaseAclService<CandidateSkill> {
  constructor() {
    super();
    this.canDo(ROLE.ADMIN, [Action.Manage]);
    this.canDo(ROLE.USER, [Action.Create, Action.List, Action.Read]);
    this.canDo(ROLE.USER, [Action.Update, Action.Delete], this.isSkillOwner);
  }

  isSkillOwner(resource: CandidateSkill, actor: Actor): boolean {
    return resource.candidateProfile?.user?.id === actor.id;
  }
}
