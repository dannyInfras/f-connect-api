import { Injectable } from '@nestjs/common';

import { ROLE } from '@/modules/auth/constants/role.constant';
import { BaseAclService } from '@/shared/acl/acl.service';
import { Action } from '@/shared/acl/action.constant';
import { Actor } from '@/shared/acl/actor.constant';

import { ScheduleEvent } from '../entities/schedule-event.entity';

interface ScheduleActor extends Actor {
  company?: {
    id: number | string;
  };
}

@Injectable()
export class ScheduleAclService extends BaseAclService<ScheduleEvent> {
  constructor() {
    super();

    // Admin can do all actions on any schedule event
    this.canDo(ROLE.ADMIN, [Action.Manage]);

    // HR/Company users (RECRUITER, ADMIN_RECRUITER) can manage events within their company
    this.canDo(
      ROLE.RECRUITER,
      [Action.Create, Action.Read, Action.Update, Action.Delete, Action.List],
      this.isWithinCompany,
    );
    this.canDo(
      ROLE.ADMIN_RECRUITER,
      [Action.Create, Action.Read, Action.Update, Action.Delete, Action.List],
      this.isWithinCompany,
    );

    // Regular users (candidates) can only view events they participate in and respond to invitations
    this.canDo(ROLE.USER, [Action.Read, Action.List], this.isParticipant);
    this.canDo(ROLE.USER, [Action.Update], this.canUpdateParticipantResponse);
  }

  /**
   * Check if the event belongs to the actor's company
   */
  private isWithinCompany(resource: ScheduleEvent, actor: Actor): boolean {
    const scheduleActor = actor as ScheduleActor;
    // If actor has company and event belongs to the same company
    return scheduleActor.company?.id?.toString() === resource.companyId;
  }

  /**
   * Check if the actor is a participant in the event
   */
  private isParticipant(resource: ScheduleEvent, actor: Actor): boolean {
    if (!resource.participants) return false;

    return resource.participants.some(
      (participant) => participant.userId === actor.id,
    );
  }

  /**
   * Check if the actor can update participant response (only their own response)
   * This is used for confirming/declining attendance
   */
  private canUpdateParticipantResponse(
    resource: ScheduleEvent,
    actor: Actor,
  ): boolean {
    if (!resource.participants) return false;

    // User can only update their own participation response
    const userParticipation = resource.participants.find(
      (participant) => participant.userId === actor.id,
    );

    return !!userParticipation;
  }

  /**
   * Check if user can create events in a specific company
   */
  public canCreateInCompany(actor: Actor, companyId: string): boolean {
    const scheduleActor = actor as ScheduleActor;
    // Admin can create events in any company
    if (actor.roles.includes(ROLE.ADMIN)) {
      return true;
    }

    // Recruiters can create events only in their own company
    if (
      actor.roles.includes(ROLE.RECRUITER) ||
      actor.roles.includes(ROLE.ADMIN_RECRUITER)
    ) {
      return scheduleActor.company?.id?.toString() === companyId;
    }

    return false;
  }

  /**
   * Check if user can view events for a specific company
   */
  public canViewCompanyEvents(actor: Actor, companyId: string): boolean {
    const scheduleActor = actor as ScheduleActor;
    // Admin can view events in any company
    if (actor.roles.includes(ROLE.ADMIN)) {
      return true;
    }

    // Recruiters can view events only in their own company
    if (
      actor.roles.includes(ROLE.RECRUITER) ||
      actor.roles.includes(ROLE.ADMIN_RECRUITER)
    ) {
      return scheduleActor.company?.id?.toString() === companyId;
    }

    return false;
  }

  /**
   * Check if user can manage participants (invite/remove participants)
   */
  public canManageParticipants(resource: ScheduleEvent, actor: Actor): boolean {
    // Admin can manage all events
    if (actor.roles.includes(ROLE.ADMIN)) {
      return true;
    }

    // Company users can manage events in their company
    if (
      actor.roles.includes(ROLE.RECRUITER) ||
      actor.roles.includes(ROLE.ADMIN_RECRUITER)
    ) {
      return this.isWithinCompany(resource, actor);
    }

    // Event creator can manage participants
    return resource.createdBy === actor.id;
  }
}
