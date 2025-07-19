import { Injectable, UnauthorizedException } from '@nestjs/common';

import { ROLE } from '@/modules/auth/constants/role.constant';
import { BaseAclService } from '@/shared/acl/acl.service';
import { Action } from '@/shared/acl/action.constant';
import { Actor } from '@/shared/acl/actor.constant';

import { TaskEntity } from '../entities/task.entity';

@Injectable()
export class TaskAclService extends BaseAclService<TaskEntity> {
  constructor() {
    super();

    // Regular users can manage their own tasks
    this.canDo(
      ROLE.USER,
      [Action.Create, Action.Read, Action.Update, Action.Delete, Action.List],
      // this.isOwner,
    );
  }

  private isOwner = (resource: TaskEntity, actor: Actor): boolean => {
    if (!resource) return false;
    return resource.userId === actor.id;
  };

  async canView(actor: Actor, task: TaskEntity): Promise<void> {
    if (!this.forActor(actor).canDoAction(Action.Read, task)) {
      throw new UnauthorizedException(
        'You do not have permission to view this task',
      );
    }
  }

  async canList(actor: Actor, userId?: number): Promise<void> {
    // Admin can list all tasks
    if (
      actor.roles.includes(ROLE.ADMIN) ||
      actor.roles.includes(ROLE.ADMIN_RECRUITER)
    ) {
      return;
    }

    // Users can only list their own tasks
    if (actor.roles.includes(ROLE.USER)) {
      if (userId && actor.id !== userId) {
        throw new UnauthorizedException('You can only view your own tasks');
      }
      return;
    }

    // Recruiters can list tasks for candidates they're working with
    if (actor.roles.includes(ROLE.RECRUITER)) {
      // In a real implementation, check if the recruiter is assigned to the user
      if (userId) {
        // For now, throw unauthorized as we don't have that relationship established
        throw new UnauthorizedException(
          'You do not have permission to view these tasks',
        );
      }
      return;
    }

    throw new UnauthorizedException('You do not have permission to list tasks');
  }

  async canCreate(actor: Actor, task: TaskEntity): Promise<void> {
    // Admins can create tasks for anyone
    if (
      actor.roles.includes(ROLE.ADMIN) ||
      actor.roles.includes(ROLE.ADMIN_RECRUITER)
    ) {
      return;
    }

    // Users can only create tasks for themselves
    if (actor.roles.includes(ROLE.USER)) {
      if (actor.id !== task.userId) {
        throw new UnauthorizedException(
          'You can only create tasks for yourself',
        );
      }
      return;
    }

    throw new UnauthorizedException(
      'You do not have permission to create tasks',
    );
  }

  async canUpdate(actor: Actor, task: TaskEntity): Promise<void> {
    if (!this.forActor(actor).canDoAction(Action.Update, task)) {
      throw new UnauthorizedException(
        'You do not have permission to update this task',
      );
    }
  }

  async canDelete(actor: Actor, task: TaskEntity): Promise<void> {
    if (!this.forActor(actor).canDoAction(Action.Delete, task)) {
      throw new UnauthorizedException(
        'You do not have permission to delete this task',
      );
    }
  }
}
