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

    // Regular users can only read categories
    this.canDo(ROLE.USER, [Action.Read, Action.List]);
  }
}
