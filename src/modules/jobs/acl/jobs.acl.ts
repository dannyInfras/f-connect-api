import { Injectable } from '@nestjs/common';

import { ROLE } from '@/modules/auth/constants/role.constant';
import { BaseAclService } from '@/shared/acl/acl.service';
import { Action } from '@/shared/acl/action.constant';
import { Actor } from '@/shared/acl/actor.constant';

import { Job } from '../entities/jobs.entity';

@Injectable()
export class JobAclService extends BaseAclService<Job> {
  constructor() {
    super();
    this.canDo(ROLE.ADMIN, [Action.Manage]);
    this.canDo(
      ROLE.ADMIN_RECRUITER,
      [Action.Create, Action.Delete, Action.Read, Action.List],
      this.isOwner,
    );
    this.canDo(
      ROLE.RECRUITER,
      [Action.Create, Action.Delete, Action.Read, Action.List],
      this.isOwner,
    );
    this.canDo(ROLE.USER, [Action.Update, Action.Read, Action.List]);
  }

  private isOwner(job: Job, actor: Actor): boolean {
    return job.company?.users?.some((user) => user.id === actor.id);
  }
}
