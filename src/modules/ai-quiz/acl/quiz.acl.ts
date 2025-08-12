import { Injectable, UnauthorizedException } from '@nestjs/common';

import { ROLE } from '@/modules/auth/constants/role.constant';
import { BaseAclService } from '@/shared/acl/acl.service';
import { Action } from '@/shared/acl/action.constant';
import { Actor } from '@/shared/acl/actor.constant';

import { Quiz } from '../entities/quiz.entity';

@Injectable()
export class QuizAclService extends BaseAclService<Quiz> {
  constructor() {
    super();
    
    // Admin can do everything
    this.canDo(ROLE.ADMIN, [Action.Manage]);

    // Regular users can manage their own quizzes
    this.canDo(
      ROLE.USER,
      [Action.Create, Action.Read, Action.Update, Action.Delete, Action.List],
      this.isOwner,
    );

    // Recruiters can view quizzes (for candidate assessment)
    this.canDo(ROLE.RECRUITER, [Action.Read, Action.List]);
    this.canDo(ROLE.ADMIN_RECRUITER, [Action.Read, Action.List]);
  }

  private isOwner = (resource: Quiz, actor: Actor): boolean => {
    if (!resource) return false;
    return resource.userId === actor.id;
  };

  async checkPermission(
    actor: Actor,
    action: Action,
    resource?: Quiz,
  ): Promise<void> {
    if (!this.forActor(actor).canDoAction(action, resource)) {
      throw new UnauthorizedException(
        `You do not have permission to ${action} this quiz`,
      );
    }
  }
}
