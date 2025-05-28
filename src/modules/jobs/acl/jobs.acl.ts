import { Injectable, UnauthorizedException } from '@nestjs/common';

import { ROLE } from '@/modules/auth/constants/role.constant';
import { BaseAclService } from '@/shared/acl/acl.service';
import { Action } from '@/shared/acl/action.constant';
import { Actor } from '@/shared/acl/actor.constant';

import { Job } from '../entities/jobs.entity';

@Injectable()
export class JobAclService extends BaseAclService<Job> {
  constructor() {
    super();
    // Admin can do everything
    this.canDo(ROLE.ADMIN, [Action.Manage]);

    // Recruiters (both admin and regular) can perform CRUD operations on their own jobs
    this.canDo(
      ROLE.ADMIN_RECRUITER,
      [Action.Create, Action.Update, Action.Delete],
      this.isOwner,
    );
    this.canDo(
      ROLE.RECRUITER,
      [Action.Create, Action.Update, Action.Delete],
      this.isOwner,
    );

    // Everyone can read and list
    this.canDo(ROLE.ADMIN, [Action.Read, Action.List]);
    this.canDo(ROLE.ADMIN_RECRUITER, [Action.Read, Action.List]);
    this.canDo(ROLE.RECRUITER, [Action.Read, Action.List]);
    this.canDo(ROLE.USER, [Action.Read, Action.List]);
  }

  private isOwner(job: Job, actor: Actor): boolean {
    return job.company?.users?.some((user) => user.id === actor.id);
  }

  async canView(): Promise<void> {
    // Everyone can view jobs
    return;
  }

  async canList(): Promise<void> {
    // Everyone can list jobs
    return;
  }

  async canCreate(actor: Actor): Promise<void> {
    if (!this.forActor(actor).canDoAction(Action.Create)) {
      throw new UnauthorizedException(
        'You do not have permission to create a job',
      );
    }
  }

  async canUpdate(actor: Actor, job: Job): Promise<void> {
    if (!this.forActor(actor).canDoAction(Action.Update, job)) {
      throw new UnauthorizedException(
        'You do not have permission to update this job',
      );
    }
  }

  async canDelete(actor: Actor, job: Job): Promise<void> {
    if (!this.forActor(actor).canDoAction(Action.Delete, job)) {
      throw new UnauthorizedException(
        'You do not have permission to delete this job',
      );
    }
  }
}
