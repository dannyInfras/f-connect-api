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

    // Admin Recruiters can manage all applications (no company restriction)
    this.canDo(
      ROLE.ADMIN_RECRUITER,
      [Action.Read, Action.Update, Action.List],
      this.isAdminRecruiterOrFromSameCompany,
    );

    // Regular Recruiters can manage applications for jobs from their company
    this.canDo(
      ROLE.RECRUITER,
      [Action.Read, Action.Update, Action.List],
      this.isRecruiterFromSameCompany,
    );

    // HR roles can view all applications from their company
    this.canDo(ROLE.RECRUITER, [Action.List], this.isFromSameCompany);

    this.canDo(ROLE.ADMIN_RECRUITER, [Action.List], this.isFromSameCompany);
  }

  isOwner(resource: JobApplication, actor: Actor): boolean {
    return resource.user.id === actor.id;
  }

  isAdminRecruiterOrFromSameCompany(
    resource: JobApplication,
    actor: Actor,
  ): boolean {
    // Admin recruiters can access all applications
    if (actor.roles && actor.roles.includes(ROLE.ADMIN_RECRUITER)) {
      return true;
    }

    // For regular recruiters, check company association
    return this.isRecruiterFromSameCompany(resource, actor);
  }

  isRecruiterFromSameCompany(resource: JobApplication, actor: Actor): boolean {
    // Check if the job belongs to the same company as the recruiter
    if (
      !resource.job?.company?.users ||
      !Array.isArray(resource.job.company.users)
    ) {
      return false;
    }

    // Check if the actor is one of the users associated with this company
    return resource.job.company.users.some((user) => user.id === actor.id);
  }

  isFromSameCompany(resource: JobApplication, actor: Actor): boolean {
    // Admin recruiters can see all applications
    if (actor.roles && actor.roles.includes(ROLE.ADMIN_RECRUITER)) {
      return true;
    }

    // Check if the job belongs to the same company
    if (!resource.job?.company) {
      return false;
    }

    // Check if the actor is one of the users associated with this company
    if (
      !resource.job.company.users ||
      !Array.isArray(resource.job.company.users)
    ) {
      return false;
    }

    // If the actor is a user of the company, they're from the same company
    return resource.job.company.users.some((user) => user.id === actor.id);
  }
}
