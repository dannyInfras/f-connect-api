import { Injectable } from '@nestjs/common';

import { ROLE } from '@/modules/auth/constants/role.constant';
import { User } from '@/modules/user/entities/user.entity';
import { BaseAclService } from '@/shared/acl/acl.service';
import { Action } from '@/shared/acl/action.constant';

/**
 * Access Control List service for admin user management operations
 * Restricts all user management operations to ADMIN role only
 */
@Injectable()
export class AdminUserAclService extends BaseAclService<User> {
  constructor() {
    super();
    // Only ADMIN users can perform any user management operations
    this.canDo(ROLE.ADMIN, [Action.Manage]);
  }
}
