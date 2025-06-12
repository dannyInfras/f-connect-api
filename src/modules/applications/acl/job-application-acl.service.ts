import { Injectable } from '@nestjs/common';

import { ROLE } from '@/modules/auth/constants/role.constant';
import { BaseAclService } from '@/shared/acl/acl.service';
import { Action } from '@/shared/acl/action.constant';
import { Actor } from '@/shared/acl/actor.constant';

import { JobApplication } from '../entities/job-application.entity';

@Injectable()
export class JobApplicationAclService extends BaseAclService<JobApplication> {
  constructor() {
    super();
    // Admins can do everything
    this.canDo(ROLE.ADMIN, [Action.Manage]);

    // Users can create applications and view/list their own applications
    this.canDo(ROLE.USER, [Action.Create]);
    this.canDo(ROLE.USER, [Action.List, Action.Read], this.isOwner);

    // Recruiters can manage applications for jobs from their company
    this.canDo(
      ROLE.RECRUITER,
      [Action.Read, Action.Update, Action.List],
      this.isRecruiterFromSameCompany,
    );

    // Admin Recruiters can manage applications for jobs from their company
    this.canDo(
      ROLE.ADMIN_RECRUITER,
      [Action.Read, Action.Update, Action.List],
      this.isRecruiterFromSameCompany,
    );
  }

  isOwner(resource: JobApplication, actor: Actor): boolean {
    return resource.user.id === actor.id;
  }

  isRecruiterFromSameCompany(resource: JobApplication, actor: Actor): boolean {
    // Check if the job belongs to the same company as the recruiter
    if (
      !resource.job?.company?.users ||
      !Array.isArray(resource.job.company.users)
    ) {
      return false;
    }

    return resource.job.company.users.some((user) => user.id === actor.id);
  }
}
