import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ROLE } from '@/modules/auth/constants/role.constant';
import { CandidateProfile } from '@/modules/candidate-profile/entities/candidate-profile.entity';
import { BaseAclService } from '@/shared/acl/acl.service';
import { Action } from '@/shared/acl/action.constant';
import { Actor } from '@/shared/acl/actor.constant';

@Injectable()
export class CandidateProfileAclService extends BaseAclService<CandidateProfile> {
  constructor(
    @InjectRepository(CandidateProfile)
    private readonly candidateProfileRepository: Repository<CandidateProfile>,
  ) {
    super();
    this.canDo(ROLE.ADMIN, [Action.Manage]);
    this.canDo(ROLE.USER, [Action.Create, Action.List, Action.Read]);
    this.canDo(ROLE.USER, [Action.Update, Action.Delete], this.isProfileOwner);
  }

  async loadProfileWithUser(
    profileId: string,
  ): Promise<CandidateProfile | null> {
    return this.candidateProfileRepository
      .createQueryBuilder('candidateProfile')
      .leftJoinAndSelect('candidateProfile.user', 'user')
      .where('candidateProfile.id = :id', { id: profileId })
      .getOne();
  }

  isProfileOwner(resource: CandidateProfile, actor: Actor): boolean {
    if (!resource.user) {
      console.warn('CandidateProfile user relation not loaded for ACL check');
      return false;
    }

    return resource.user.id === actor.id;
  }
}
