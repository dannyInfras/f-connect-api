import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ROLE } from '@/modules/auth/constants/role.constant';
import { CandidateSkill } from '@/modules/candidate-profile/entities/candidate-skill.entity';
import { BaseAclService } from '@/shared/acl/acl.service';
import { Action } from '@/shared/acl/action.constant';
import { Actor } from '@/shared/acl/actor.constant';

import { User } from '../../user/entities/user.entity';
import { CandidateProfile } from '../entities/candidate-profile.entity';

@Injectable()
export class CandidateSkillAclService extends BaseAclService<CandidateSkill> {
  constructor(
    @InjectRepository(User)
    private readonly candidateProfileRepository: Repository<CandidateProfile>,
  ) {
    super();
    this.canDo(ROLE.ADMIN, [Action.Manage]);
    this.canDo(ROLE.USER, [Action.Create, Action.List, Action.Read]);
    this.canDo(ROLE.USER, [Action.Update, Action.Delete], this.isSkillOwner);
  }

  isSkillOwner(resource: CandidateSkill, actor: Actor): boolean {
    return resource.candidateProfile?.user?.id === actor.id;
  }
}
