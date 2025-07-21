import { Injectable } from '@nestjs/common';

import { ROLE } from '@/modules/auth/constants/role.constant';
import { BaseAclService } from '@/shared/acl/acl.service';
import { Action } from '@/shared/acl/action.constant';

import { Roadmap } from '../entities/roadmap.entity';
// import { Actor } from '@/shared/acl/actor.constant';

@Injectable()
export class RoadmapAclService extends BaseAclService<Roadmap> {
  constructor() {
    super();

    this.canDo(
      ROLE.USER,
      [Action.Manage],
      // this.isOwner
    );
  }

  // private isOwner = (resource: Roadmap, actor: Actor): boolean => {
  //   if (!resource) return false;
  //   return resource.userId === actor.id;
  // };
}
