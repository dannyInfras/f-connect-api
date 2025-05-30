import { Injectable, UnauthorizedException } from '@nestjs/common';

import { ROLE } from '@/modules/auth/constants/role.constant';
import { BaseAclService } from '@/shared/acl/acl.service';
import { Action } from '@/shared/acl/action.constant';
import { Actor } from '@/shared/acl/actor.constant';

import { CV } from '../entities/cv.entity';

@Injectable()
export class CvAclService extends BaseAclService<CV> {
  constructor() {
    super();
    // Admin can do everything
    this.canDo(ROLE.ADMIN, [Action.Manage]);

    // Regular users can manage their own CVs
    this.canDo(
      ROLE.USER,
      [Action.Create, Action.Read, Action.Update, Action.Delete, Action.List],
      this.isOwner,
    );

    // Recruiters can view CVs (for job applications)
    this.canDo(ROLE.RECRUITER, [Action.Read, Action.List]);
    this.canDo(ROLE.ADMIN_RECRUITER, [Action.Read, Action.List]);
  }

  private isOwner = (resource: CV, actor: Actor): boolean => {
    if (!resource) return false;
    return resource.userId === actor.id;
  };

  async canView(actor: Actor, cv: CV): Promise<void> {
    if (!this.forActor(actor).canDoAction(Action.Read, cv)) {
      throw new UnauthorizedException(
        'You do not have permission to view this CV',
      );
    }
  }

  async canList(actor: Actor, userId?: number): Promise<void> {
    // Admin can list all CVs
    if (actor.roles.includes(ROLE.ADMIN)) {
      return;
    }

    // Recruiters can list all CVs
    if (
      actor.roles.includes(ROLE.RECRUITER) ||
      actor.roles.includes(ROLE.ADMIN_RECRUITER)
    ) {
      return;
    }

    // Users can only list their own CVs
    if (actor.roles.includes(ROLE.USER)) {
      if (userId && actor.id !== userId) {
        throw new UnauthorizedException('You can only view your own CVs');
      }
      return;
    }

    throw new UnauthorizedException('You do not have permission to list CVs');
  }

  async canCreate(actor: Actor, cv: CV): Promise<void> {
    // Only users can create CVs for themselves
    if (!actor.roles.includes(ROLE.USER) || actor.id !== cv.userId) {
      throw new UnauthorizedException('You can only create CVs for yourself');
    }
  }

  async canUpdate(actor: Actor, cv: CV): Promise<void> {
    if (!this.forActor(actor).canDoAction(Action.Update, cv)) {
      throw new UnauthorizedException(
        'You do not have permission to update this CV',
      );
    }
  }

  async canDelete(actor: Actor, cv: CV): Promise<void> {
    if (!this.forActor(actor).canDoAction(Action.Delete, cv)) {
      throw new UnauthorizedException(
        'You do not have permission to delete this CV',
      );
    }
  }
}
