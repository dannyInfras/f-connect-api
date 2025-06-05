import { Injectable } from '@nestjs/common';

import { BaseAclService } from '../../../shared/acl/acl.service';
import { Action } from '../../../shared/acl/action.constant';
import { Actor } from '../../../shared/acl/actor.constant';
import { ROLE } from '../../auth/constants/role.constant';
import { JobApplication } from '../entities/job-application.entity';

@Injectable()
export class JobApplicationAclService extends BaseAclService<JobApplication> {
  constructor() {
    super();
    this.canDo(ROLE.ADMIN, [Action.Manage]);
    this.canDo(ROLE.USER, [Action.Create]);
    this.canDo(
      ROLE.USER,
      [Action.List, Action.Update, Action.Delete],
      this.isOwner,
    );
  }

  isOwner(resource: JobApplication, actor: Actor): boolean {
    return resource.user.id === actor.id;
  }
}
