import { Injectable } from '@nestjs/common';

import { ROLE } from '@/modules/auth/constants/role.constant';
import { BaseAclService } from '@/shared/acl/acl.service';
import { Action } from '@/shared/acl/action.constant';

import { Category } from '../entities/category.entity';

@Injectable()
export class CategoryAclService extends BaseAclService<Category> {
  constructor() {
    super();
    // Admins can manage all actions
    this.canDo(ROLE.ADMIN, [Action.Manage]);

    this.canDo(ROLE.ADMIN_RECRUITER, [
      Action.Read,
      Action.Update,
      Action.Delete,
      Action.List,
    ]);
    this.canDo(ROLE.RECRUITER, [Action.Read, Action.Update, Action.List]);
    this.canDo(ROLE.USER, [Action.Read, Action.List]);
  }
}
