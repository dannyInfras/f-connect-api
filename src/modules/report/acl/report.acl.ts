import { Injectable, UnauthorizedException } from '@nestjs/common';

import { ROLE } from '@/modules/auth/constants/role.constant';
import { BaseAclService } from '@/shared/acl/acl.service';
import { Action } from '@/shared/acl/action.constant';
import { Actor } from '@/shared/acl/actor.constant';

import { Report } from '../entities/report.entity';

@Injectable()
export class ReportAclService extends BaseAclService<Report> {
  constructor() {
    super();

    // Admin can do everything
    this.canDo(ROLE.ADMIN, [Action.Manage]);

    // Admin recruiters can view and update reports (admin privilege)
    this.canDo(ROLE.ADMIN_RECRUITER, [Action.Read, Action.List, Action.Update]);

    // Regular users can create reports (no callback needed for creation)
    this.canDo(ROLE.USER, [Action.Create]);
    this.canDo(ROLE.RECRUITER, [Action.Create]);

    // Users can read and list their own reports (with ownership check)
    this.canDo(ROLE.USER, [Action.Read, Action.List], this.isOwner);
    this.canDo(ROLE.RECRUITER, [Action.Read, Action.List], this.isOwner);
  }

  private isOwner(report: Report, actor: Actor): boolean {
    return report.userId === actor.id;
  }

  async canView(): Promise<void> {
    // Everyone can view (will be filtered in service)
    return;
  }

  async canList(): Promise<void> {
    // Everyone can list (will be filtered in service)
    return;
  }

  async canCreate(actor: Actor): Promise<void> {
    if (!this.forActor(actor).canDoAction(Action.Create)) {
      throw new UnauthorizedException(
        'You do not have permission to create a report',
      );
    }
  }

  async canUpdate(): Promise<void> {
    // Only admins can update report status
    // This will be checked in the service
    return;
  }

  async canDelete(actor: Actor, report: Report): Promise<void> {
    if (!this.forActor(actor).canDoAction(Action.Delete, report)) {
      throw new UnauthorizedException(
        'You do not have permission to delete this report',
      );
    }
  }
}
