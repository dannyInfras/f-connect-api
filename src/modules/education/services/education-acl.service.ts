import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ROLE } from '@/modules/auth/constants/role.constant';
import { Education } from '@/modules/education/entities/education.entity';
import { BaseAclService } from '@/shared/acl/acl.service';
import { Action } from '@/shared/acl/action.constant';
import { Actor } from '@/shared/acl/actor.constant';

import { CandidateProfile } from '../../candidate-profile/entities/candidate-profile.entity';

@Injectable()
export class EducationAclService extends BaseAclService<Education> {
  constructor(
    @InjectRepository(CandidateProfile)
    private readonly candidateProfileRepository: Repository<CandidateProfile>,
  ) {
    super();
    this.canDo(ROLE.ADMIN, [Action.Manage]);
    this.canDo(ROLE.USER, [Action.Create]);
    this.canDo(
      ROLE.USER,
      [Action.List, Action.Read, Action.Update, Action.Delete],
      this.isEducationOwner,
    );
  }

  isEducationOwner(resource: Education, actor: Actor): boolean {
    if (!resource.candidateProfile.user) {
      return false;
    }

    return resource.candidateProfile.user.id === actor.id;
  }
}
